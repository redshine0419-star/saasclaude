import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

// Vercel Cron: 0 0 * * 1 — 매주 월요일 00:00 UTC (KST 09:00)
// 레벨테스트 슬롯이 있는 모든 활성 테넌트에게 "이번 주 수업 확인" 알림 발송

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  let sent = 0;
  let failed = 0;

  // 활성 테넌트 + notify_recipients + classes (잔여석 포함)
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    include: {
      notifyRecipients: true,
      classes: {
        orderBy: { sortOrder: 'asc' },
        select: { name: true, gradeBand: true, seatsLeft: true, capacity: true },
      },
    },
  });

  for (const tenant of tenants) {
    if (tenant.notifyRecipients.length === 0) continue;
    if (tenant.classes.length === 0) continue;

    // 잔여석 요약 텍스트
    const classSummary = tenant.classes
      .map((c) => {
        const seats = c.seatsLeft !== null ? `잔여 ${c.seatsLeft}석` : '';
        return `- ${c.name}(${c.gradeBand ?? ''}) ${seats}`.trim();
      })
      .join('\n');

    const body =
      `[${tenant.name}] 이번 주 수업 현황을 확인해 주세요.\n\n` +
      `${classSummary}\n\n` +
      `잔여석이 변경된 경우 관리자에서 업데이트해 주세요.\n` +
      `관리자: https://growweb.me/${tenant.slug}/admin/classes`;

    for (const recipient of tenant.notifyRecipients) {
      const recipientHash = hashPhone(recipient.phone);
      try {
        await sendMessage({
          tenantId: tenant.id,
          recipientId: recipient.id,
          recipientHash,
          phone: recipient.phone,
          kind: 'owner_alert',
          body,
          isAdvertisement: false,
          consent: { marketing: true, night: true },
          requestedAt: now,
        });
        sent++;
      } catch {
        failed++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, failed, at: now.toISOString() });
}
