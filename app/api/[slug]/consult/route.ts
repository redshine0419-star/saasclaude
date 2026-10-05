import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

const CONSULT_TYPE_MAP: Record<string, 'level_test' | 'phone' | 'visit'> = {
  '레벨테스트 예약': 'level_test',
  '전화 상담': 'phone',
  '방문 상담': 'visit',
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.tel) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
  }

  // 데모 테넌트: DB 저장 없이 mock 응답
  const DEMO_SLUGS = new Set(['demo', 'demo-warm', 'demo-result', 'demo-bright']);
  if (DEMO_SLUGS.has(slug)) {
    return NextResponse.json({ ok: true, demo: true });
  }

  // ── 테넌트 조회 ──────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
    include: { notifyRecipients: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  }

  const phone: string = body.tel as string;
  const recipientHash = hashPhone(phone);
  const consultType = CONSULT_TYPE_MAP[body.consultType as string] ?? 'level_test';

  // UTM 파라미터 — 클라이언트가 JSON으로 전달 (SPEC line 99)
  const utm =
    body.utm &&
    typeof body.utm === 'object' &&
    !Array.isArray(body.utm)
      ? {
          source: body.utm.source ?? null,
          medium: body.utm.medium ?? null,
          campaign: body.utm.campaign ?? null,
          content: body.utm.content ?? null,
          term: body.utm.term ?? null,
        }
      : undefined;

  // ── Lead 생성 ─────────────────────────────────────────────────────────
  const lead = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      parentName: body.name as string,
      phone,
      studentGrade: body.grade ?? null,
      school: body.school ?? null,
      consultType,
      preferredSlotId: body.slotId && body.slotId !== 'custom' ? body.slotId : null,
      message: body.message ?? null,
      source: (body.utm?.source as string | undefined) ?? req.headers.get('referer') ?? 'web',
      utm,
    },
  });

  // ── Consent 3종 저장 ──────────────────────────────────────────────────
  const now = new Date();
  const twoYearsLater = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

  await prisma.consent.createMany({
    data: [
      {
        tenantId: tenant.id,
        leadId: lead.id,
        type: 'privacy',
        grantedAt: now,
        channel: 'web',
      },
      {
        tenantId: tenant.id,
        leadId: lead.id,
        type: 'marketing',
        grantedAt: body.agreeMarketing ? now : null,
        channel: 'web',
        reconfirmDueAt: body.agreeMarketing ? twoYearsLater : null,
      },
      {
        tenantId: tenant.id,
        leadId: lead.id,
        type: 'night',
        grantedAt: body.agreeNight ? now : null,
        channel: 'web',
      },
    ],
  });

  // ── lead_events: 접수 기록 ────────────────────────────────────────────
  await prisma.leadEvent.create({
    data: {
      leadId: lead.id,
      type: 'created',
      payload: { note: `웹 상담 신청 (${consultType})` },
    },
  });

  // ── receipt 발송 (학부모에게) ─────────────────────────────────────────
  const receiptTemplate = await prisma.messageTemplate.findUnique({
    where: { tenantId_scenario: { tenantId: tenant.id, scenario: 'receipt' } },
  });

  if (receiptTemplate?.reviewStatus === 'approved' && receiptTemplate.approvedBody) {
    await dispatchMessage({
      tenantId: tenant.id,
      leadId: lead.id,
      recipientHash,
      phone,
      scenario: 'receipt',
      kind: 'info',
      body: receiptTemplate.approvedBody,
      marketingConsent: body.agreeMarketing ?? false,
      nightConsent: body.agreeNight ?? false,
    });
  }

  // ── owner_alert 발송 (notify_recipients에게) ──────────────────────────
  const alertTemplate = await prisma.messageTemplate.findUnique({
    where: { tenantId_scenario: { tenantId: tenant.id, scenario: 'owner_alert' } },
  });

  if (alertTemplate?.reviewStatus === 'approved' && alertTemplate.approvedBody) {
    for (const recipient of tenant.notifyRecipients) {
      const recipientHashOwner = hashPhone(recipient.phone);
      await dispatchMessage({
        tenantId: tenant.id,
        leadId: lead.id,
        recipientHash: recipientHashOwner,
        phone: recipient.phone,
        scenario: 'owner_alert',
        kind: 'info',
        body: alertTemplate.approvedBody
          .replace('{{parentName}}', lead.parentName)
          .replace('{{grade}}', lead.studentGrade ?? '미기재')
          .replace('{{consultType}}', body.consultType ?? ''),
        marketingConsent: true,  // 원장 알림은 동의 체크 불필요 (정보성)
        nightConsent: true,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

// ── 내부 헬퍼: 규칙 적용 후 messages 테이블 기록 ─────────────────────────────

async function dispatchMessage(opts: {
  tenantId: string;
  leadId: string;
  recipientHash: string;
  phone: string;
  scenario: 'receipt' | 'owner_alert' | 'reminder' | 'followup' | 'campaign' | 'reconfirm';
  kind: 'info' | 'ad';
  body: string;
  marketingConsent: boolean;
  nightConsent: boolean;
}) {
  const now = new Date();
  const result = await sendMessage({
    tenantId: opts.tenantId,
    recipientId: opts.leadId,
    recipientHash: opts.recipientHash,
    phone: opts.phone,
    kind: opts.scenario,
    body: opts.body,
    isAdvertisement: opts.kind === 'ad',
    consent: { marketing: opts.marketingConsent, night: opts.nightConsent },
    requestedAt: now,
  });

  // messages 테이블에 기록
  const channel = result.dispatched ? (result as { channel?: string }).channel ?? 'alimtalk' : 'alimtalk';
  await prisma.message.create({
    data: {
      tenantId: opts.tenantId,
      leadId: opts.leadId,
      scenario: opts.scenario,
      kind: opts.kind === 'ad' ? 'ad' : 'info',
      channel: channel as 'alimtalk' | 'sms_fallback',
      recipientHash: opts.recipientHash,
      status: !result.dispatched
        ? 'failed'
        : result.scheduledAt > now
        ? 'deferred'
        : 'sent',
      sentAt: result.dispatched && result.scheduledAt <= now ? now : null,
      error: !result.dispatched ? result.reason : null,
    },
  });
}
