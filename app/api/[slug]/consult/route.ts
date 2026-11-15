import { NextRequest, NextResponse } from 'next/server';
import { notifyOwner } from '@/lib/notify/owner';
import { createSmsTask } from '@/lib/sms/tasks';
import { prisma } from '@/lib/prisma';

// SPEC line 137: UTM → referrer 분류 → direct
function classifyReferer(referer: string | null): string {
  if (!referer) return 'direct';
  try {
    const url = new URL(referer);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'naver.com' || host.endsWith('.naver.com')) {
      if (url.pathname.includes('/place')) return 'naver_place';
      return 'naver_search';
    }
    if (host === 'blog.naver.com') return 'naver_blog';
    if (host === 'kakao.com' || host.endsWith('.kakao.com')) return 'kakao';
    if (host === 'chatgpt.com' || host === 'chat.openai.com') return 'ai_chatgpt';
    if (host === 'perplexity.ai') return 'ai_perplexity';
    if (host === 'gemini.google.com') return 'ai_gemini';
    if (host === 'google.com' || host.endsWith('.google.com')) return 'google';
    if (host === 'instagram.com' || host === 't.co' || host === 'facebook.com') return 'social';
    return 'referral';
  } catch {
    return 'direct';
  }
}

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

  // 필수 동의: 학부모(법정대리인) 확인 + 개인정보 수집·이용 (lib/legal/consents.ts consultConsents) — 서버에서 막는다
  if (body.guardianConfirmed !== true || body.agreePrivacy !== true) {
    return NextResponse.json({ error: '필수 동의 항목(학부모 확인, 개인정보 수집·이용)에 동의해 주세요.' }, { status: 400 });
  }

  // 허니팟 필드: 봇은 채우고 사람은 비운다 (필드명은 _hp로 숨김)
  if (body._hp) {
    return NextResponse.json({ ok: true }); // 봇에게는 성공처럼 보임
  }

  // 데모 테넌트: DB 저장 없이 mock 응답
  const DEMO_SLUGS = new Set(['demo', 'demo-warm', 'demo-result', 'demo-bright']);
  if (DEMO_SLUGS.has(slug)) {
    return NextResponse.json({ ok: true, demo: true });
  }

  // ── 테넌트 조회 ──────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active', published: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  }

  const phone: string = body.tel as string;

  // ── 중복 신청 체크: 같은 번호로 7일 안에 재신청 → 기존 lead에 event 추가 ──
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existingLead = await prisma.lead.findFirst({
    where: { tenantId: tenant.id, phone, createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'desc' },
  });
  if (existingLead) {
    await prisma.leadEvent.create({
      data: {
        leadId: existingLead.id,
        type: 'note',
        payload: { note: '동일 번호 재신청 (7일 이내 중복)', consultType: body.consultType ?? '' },
      },
    });
    return NextResponse.json({ ok: true, leadId: existingLead.id });
  }
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
      source: (body.utm?.source as string | undefined) ?? classifyReferer(req.headers.get('referer')),
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
        grantedAt: body.agreeMarketing === true ? now : null,
        channel: 'web',
        reconfirmDueAt: body.agreeMarketing === true ? twoYearsLater : null,
      },
      {
        tenantId: tenant.id,
        leadId: lead.id,
        type: 'night',
        grantedAt: body.agreeNight === true ? now : null,
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

  // ── 학부모 접수 확인: 자동 발송 대신 "보낼 문자"에 올린다 (원장이 휴대폰 문자로 보낸다) ──
  await createSmsTask(tenant.id, lead.id, 'receipt', now).catch((e) => console.error('[consult] 보낼 문자 만들기 실패', e instanceof Error ? e.message : e));

  // ── 원장·직원 알림: 알림함 + 앱 알림 + 원장 이메일 (카톡 대신) ──
  const masked = lead.parentName ? `${lead.parentName.slice(0, 1)}○○` : '학부모';
  await notifyOwner(tenant.id, {
    kind: 'new_lead',
    title: `새 상담 신청 — ${tenant.name}`,
    body: [`${masked} 학부모`, lead.studentGrade, lead.consultType === 'level_test' ? '레벨테스트 예약' : lead.consultType === 'visit' ? '방문 상담' : lead.consultType === 'waitlist' ? '수업 대기 신청' : '전화 상담'].filter(Boolean).join(' · ') + '\n접수 확인 문자를 보내 주세요.',
    url: `/${slug}/admin/sms`,
    tag: 'new-lead',
    email: true,
  }).catch((e) => console.error('[consult] 원장 알림 실패', e instanceof Error ? e.message : e));

  return NextResponse.json({ ok: true, leadId: lead.id });
}
