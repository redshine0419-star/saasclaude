import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

// Vercel Cron: 0 9 * * * — 매일 18:00 KST (09:00 UTC)
// test_booked 상태 leads 중 내일 테스트 예정자에게 reminder 발송

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // "내일" KST 날짜 계산
  // KST = UTC + 9h. 현재가 09:00 UTC = 18:00 KST이므로, 내일 KST 날짜를 구한다.
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);
  const tomorrowKST = new Date(kstNow);
  tomorrowKST.setUTCDate(tomorrowKST.getUTCDate() + 1);
  const tomorrowWeekday = tomorrowKST.getUTCDay(); // 0=Sun~6=Sat

  // 내일 KST 날짜의 UTC 범위 (00:00 ~ 23:59 KST = 전날 15:00 ~ 당일 14:59 UTC)
  const tomorrowKSTMidnight = Date.UTC(
    tomorrowKST.getUTCFullYear(),
    tomorrowKST.getUTCMonth(),
    tomorrowKST.getUTCDate(),
  );
  const tomorrowStart = new Date(tomorrowKSTMidnight - 9 * 3600 * 1000); // 15:00 UTC today
  const tomorrowEnd = new Date(tomorrowKSTMidnight - 9 * 3600 * 1000 + 24 * 3600 * 1000); // 15:00 UTC tomorrow

  let dispatched = 0;
  let skipped = 0;

  // test_booked 상태의 모든 leads (slot 정보 포함)
  const leads = await prisma.lead.findMany({
    where: { status: 'test_booked', preferredSlotId: { not: null } },
    include: {
      preferredSlot: true,
      consents: { where: { revokedAt: null, grantedAt: { not: null } } },
      messages: { where: { scenario: 'reminder', status: { in: ['sent', 'pending', 'deferred'] } } },
    },
    take: 100,
  });

  for (const lead of leads) {
    if (!lead.phone || !lead.preferredSlot) continue;

    // 이미 reminder 발송된 경우 건너뜀
    if (lead.messages.length > 0) { skipped++; continue; }

    const slot = lead.preferredSlot;
    let isTestTomorrow = false;

    if (slot.date) {
      // 특정 날짜 슬롯: 내일 KST 날짜와 일치하는지
      isTestTomorrow = slot.date >= tomorrowStart && slot.date < tomorrowEnd;
    } else if (slot.weekday !== null && slot.weekday !== undefined) {
      // 요일 반복 슬롯: 내일 요일과 일치하는지
      isTestTomorrow = slot.weekday === tomorrowWeekday;
    }

    if (!isTestTomorrow) continue;

    // 해당 테넌트의 reminder 템플릿 조회
    const [template, tenant] = await Promise.all([
      prisma.messageTemplate.findUnique({
        where: { tenantId_scenario: { tenantId: lead.tenantId, scenario: 'reminder' } },
      }),
      prisma.tenant.findUnique({ where: { id: lead.tenantId }, select: { name: true } }),
    ]);
    if (!template?.approvedBody) { skipped++; continue; }

    const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
    const slotLabel = slot.date
      ? `${new Date(slot.date.getTime() + 9 * 3600000).toISOString().slice(0, 10)} ${slot.time ?? ''}`
      : slot.weekday !== null && slot.weekday !== undefined
        ? `${WEEKDAY_LABELS[slot.weekday]}요일 ${slot.time ?? ''}`
        : slot.time ?? '';

    const reminderBody = template.approvedBody
      .replace(/#{학부모명}/g, lead.parentName ?? '')
      .replace(/#{학원명}/g, tenant?.name ?? '')
      .replace(/#{테스트일시}/g, slotLabel.trim());

    const consentSet = new Set(lead.consents.map((c) => c.type));
    const recipientHash = hashPhone(lead.phone);

    const result = await sendMessage({
      tenantId: lead.tenantId,
      recipientId: lead.id,
      recipientHash,
      phone: lead.phone,
      kind: 'reminder',
      body: reminderBody,
      isAdvertisement: false, // reminder는 정보성
      consent: { marketing: consentSet.has('marketing'), night: consentSet.has('night') },
      requestedAt: now,
    });

    const status = result.dispatched
      ? 'status' in result && result.status === 'sent' ? 'sent' : 'deferred'
      : 'failed';

    await prisma.message.create({
      data: {
        tenantId: lead.tenantId,
        leadId: lead.id,
        scenario: 'reminder',
        kind: 'info',
        recipientHash,
        status,
        sentAt: status === 'sent' ? now : undefined,
        error: !result.dispatched ? result.reason : undefined,
      },
    });

    if (status === 'sent') dispatched++;
  }

  return NextResponse.json({
    ok: true,
    dispatched,
    skipped,
    at: now.toISOString(),
  });
}
