import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

// Vercel Cron: */5 * * * * — 5분마다 실행
// 1) 야간 차단으로 deferred된 Messages 재시도
// 2) 카카오 예약 발송이 있는 Posts 처리
// 3) not_enrolled 후 [3]일 지난 leads에 followup 발송 (자동화 켜진 경우)
// 4) 마케팅 동의 만료 30일 전 reconfirm 발송

export async function GET(req: Request) {
  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 붙임
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let dispatched = 0;
  let failed = 0;

  // ── 1. Deferred messages ─────────────────────────────────────────
  const deferredMessages = await prisma.message.findMany({
    where: {
      status: 'deferred',
      scheduledAt: { lte: now },
    },
    include: { lead: true },
    take: 50,
  });

  for (const msg of deferredMessages) {
    if (!msg.lead?.phone) {
      await prisma.message.update({ where: { id: msg.id }, data: { status: 'failed', error: 'no_phone', sentAt: now } });
      failed++;
      continue;
    }

    // Fetch current consent for this lead
    const consents = await prisma.consent.findMany({
      where: { tenantId: msg.tenantId, leadId: msg.leadId ?? '', revokedAt: null, grantedAt: { not: null } },
    });
    const consentSet = new Set(consents.map((c) => c.type));

    const isAd = msg.kind === 'ad';
    const result = await sendMessage({
      tenantId: msg.tenantId,
      recipientId: msg.leadId ?? msg.id,
      recipientHash: msg.recipientHash,
      phone: msg.lead.phone,
      kind: msg.scenario as Parameters<typeof sendMessage>[0]['kind'],
      body: '',
      isAdvertisement: isAd,
      consent: { marketing: consentSet.has('marketing'), night: consentSet.has('night') },
      requestedAt: now,
    });

    if (result.dispatched && 'status' in result && result.status === 'sent') {
      await prisma.message.update({ where: { id: msg.id }, data: { status: 'sent', sentAt: now } });
      dispatched++;
    } else if (!result.dispatched && result.reason === 'no_marketing_consent') {
      await prisma.message.update({ where: { id: msg.id }, data: { status: 'failed', error: result.reason, sentAt: now } });
      failed++;
    }
    // If still deferred (e.g. still night), leave as is
  }

  // ── 2. Post kakao scheduled dispatch ─────────────────────────────
  const pendingPosts = await prisma.post.findMany({
    where: {
      sendKakao: true,
      kakaoScheduledAt: { lte: now },
      kakaoSentAt: null,
      status: 'published',
    },
    include: { tenant: true },
    take: 20,
  });

  for (const post of pendingPosts) {
    // Find marketing-consented leads for this tenant
    const consentedLeads = await prisma.consent.findMany({
      where: {
        tenantId: post.tenantId,
        type: 'marketing',
        grantedAt: { not: null },
        revokedAt: null,
      },
      include: { lead: { select: { id: true, phone: true } } },
    });

    let postDispatched = 0;
    for (const consent of consentedLeads) {
      if (!consent.lead?.phone) continue;
      const recipientHash = hashPhone(consent.lead.phone);

      await sendMessage({
        tenantId: post.tenantId,
        recipientId: consent.leadId,
        recipientHash,
        phone: consent.lead.phone,
        kind: 'campaign',
        body: `[${post.tenant.name}] ${post.title}\n\n${post.body.slice(0, 200)}`,
        isAdvertisement: true,
        consent: { marketing: true, night: true }, // already validated consent; scheduledAt was cleared for night
        requestedAt: now,
      });
      postDispatched++;
    }

    await prisma.post.update({ where: { id: post.id }, data: { kakaoSentAt: now } });
    dispatched += postDispatched;
  }

  // ── 3. Followup: not_enrolled 후 3일 지난 leads ─────────────────
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Find tenants with followup automation enabled
  const followupSettings = await prisma.automationSetting.findMany({
    where: { scenario: 'followup', enabled: true },
    select: { tenantId: true, delayRule: true },
  });

  for (const setting of followupSettings) {
    // Find leads that went not_enrolled >= 3 days ago with no followup sent
    const leadsToFollowup = await prisma.lead.findMany({
      where: {
        tenantId: setting.tenantId,
        status: 'not_enrolled',
        statusChangedAt: { lte: threeDaysAgo },
        // Exclude leads that already received a followup
        messages: {
          none: { scenario: 'followup', status: { in: ['sent', 'pending', 'deferred'] } },
        },
      },
      include: { consents: { where: { revokedAt: null, grantedAt: { not: null } } } },
      take: 20,
    });

    for (const lead of leadsToFollowup) {
      if (!lead.phone) continue;
      const consentSet = new Set(lead.consents.map((c) => c.type));
      if (!consentSet.has('marketing')) continue;

      const recipientHash = hashPhone(lead.phone);

      const template = await prisma.messageTemplate.findUnique({
        where: { tenantId_scenario: { tenantId: setting.tenantId, scenario: 'followup' } },
      });
      if (!template?.approvedBody) continue;

      const result = await sendMessage({
        tenantId: setting.tenantId,
        recipientId: lead.id,
        recipientHash,
        phone: lead.phone,
        kind: 'followup',
        body: template.approvedBody,
        isAdvertisement: true,
        consent: { marketing: true, night: consentSet.has('night') },
        requestedAt: now,
      });

      const status = result.dispatched
        ? 'status' in result && result.status === 'sent' ? 'sent' : 'deferred'
        : 'failed';

      await prisma.message.create({
        data: {
          tenantId: setting.tenantId,
          leadId: lead.id,
          scenario: 'followup',
          kind: 'ad',
          recipientHash,
          status,
          sentAt: status === 'sent' ? now : undefined,
          scheduledAt: status === 'deferred' && result.dispatched ? (result as { scheduledAt?: Date }).scheduledAt : undefined,
          error: !result.dispatched ? result.reason : undefined,
        },
      });

      if (status === 'sent') dispatched++;
    }
  }

  // ── 4. Reconfirm: 마케팅 동의일 기준 2년 도래 30일 전 ─────────────
  // 동의일 + 2년 = 만료일. 오늘이 만료일 - 30일 ~ 만료일 - 29일 사이인 consents 찾기
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const thirtyOneDaysFromNow = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
  // grantedAt + 2년 ∈ [now+30d, now+31d) → grantedAt ∈ [now+30d-2y, now+31d-2y)
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
  const reconfirmStart = new Date(thirtyDaysFromNow.getTime() - twoYearsMs);
  const reconfirmEnd = new Date(thirtyOneDaysFromNow.getTime() - twoYearsMs);

  const expiringConsents = await prisma.consent.findMany({
    where: {
      type: 'marketing',
      grantedAt: { gte: reconfirmStart, lt: reconfirmEnd },
      revokedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      leadId: true,
      lead: { select: { id: true, phone: true, tenantId: true } },
    },
    take: 100,
  });

  for (const consent of expiringConsents) {
    if (!consent.lead?.phone) continue;
    const tenantId = consent.tenantId;

    // Skip if already sent reconfirm for this lead recently
    const existing = await prisma.message.findFirst({
      where: {
        tenantId,
        leadId: consent.leadId,
        scenario: 'reconfirm',
        status: { in: ['sent', 'pending', 'deferred'] },
        createdAt: { gte: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000) },
      },
    });
    if (existing) continue;

    const template = await prisma.messageTemplate.findUnique({
      where: { tenantId_scenario: { tenantId, scenario: 'reconfirm' } },
    });
    if (!template?.approvedBody) continue;

    const recipientHash = hashPhone(consent.lead.phone);

    const result = await sendMessage({
      tenantId,
      recipientId: consent.leadId,
      recipientHash,
      phone: consent.lead.phone,
      kind: 'reconfirm',
      body: template.approvedBody,
      isAdvertisement: false,
      consent: { marketing: true, night: true },
      requestedAt: now,
    });

    const status = result.dispatched
      ? 'status' in result && result.status === 'sent' ? 'sent' : 'deferred'
      : 'failed';

    await prisma.message.create({
      data: {
        tenantId,
        leadId: consent.leadId,
        scenario: 'reconfirm',
        kind: 'info',
        recipientHash,
        status,
        sentAt: status === 'sent' ? now : undefined,
        scheduledAt: status === 'deferred' && result.dispatched ? (result as { scheduledAt?: Date }).scheduledAt : undefined,
        error: !result.dispatched ? result.reason : undefined,
      },
    });

    if (status === 'sent') dispatched++;
  }

  return NextResponse.json({ ok: true, dispatched, failed, at: now.toISOString() });
}
