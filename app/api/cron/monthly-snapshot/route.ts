import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';

// Vercel Cron: 0 1 1 * * — 매월 1일 01:00 UTC (KST 10:00)
// 전월 통계 스냅샷을 모든 활성 테넌트의 monthly_reports에 저장

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // 전월 계산
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const monthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  const monthStart = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
  const monthEnd = new Date(Date.UTC(prevYear, prevMonth, 1));

  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true },
  });

  let generated = 0;

  for (const tenant of tenants) {
    const [
      totalLeads,
      newLeads,
      contactedLeads,
      testBookedLeads,
      enrolledLeads,
      notEnrolledLeads,
      messagesSent,
      marketingConsents,
    ] = await Promise.all([
      prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd } } }),
      prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd }, status: 'new' } }),
      prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd }, status: 'contacted' } }),
      prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd }, status: 'test_booked' } }),
      prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd }, status: 'enrolled' } }),
      prisma.lead.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd }, status: 'not_enrolled' } }),
      prisma.message.count({ where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd }, status: 'sent' } }),
      prisma.consent.count({ where: { tenantId: tenant.id, type: 'marketing', grantedAt: { not: null }, revokedAt: null } }),
    ]);

    // Source 분포
    const leads = await prisma.lead.findMany({
      where: { tenantId: tenant.id, createdAt: { gte: monthStart, lt: monthEnd } },
      select: { source: true },
    });

    const sourceCounts: Record<string, number> = {};
    for (const lead of leads) {
      const src = lead.source ?? 'direct';
      sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    }

    const conversionRate = totalLeads > 0 ? Math.round((enrolledLeads / totalLeads) * 100) : 0;

    const snapshot = {
      month: monthKey,
      leads: {
        total: totalLeads,
        new: newLeads,
        contacted: contactedLeads,
        testBooked: testBookedLeads,
        enrolled: enrolledLeads,
        notEnrolled: notEnrolledLeads,
        conversionRate,
      },
      messages: {
        sent: messagesSent,
        marketingConsents,
      },
      sources: sourceCounts,
      generatedAt: now.toISOString(),
    };

    await prisma.monthlyReport.upsert({
      where: { tenantId_month: { tenantId: tenant.id, month: monthKey } },
      update: { snapshot },
      create: { tenantId: tenant.id, month: monthKey, snapshot },
    });

    // ── 월간 요약 카톡 발송 (notify_recipients에게) ────────────────
    const tenantFull = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { name: true, slug: true, notifyRecipients: true },
    });

    if (tenantFull && tenantFull.notifyRecipients.length > 0) {
      const summaryBody =
        `[${tenantFull.name}] ${monthKey} 월간 리포트\n\n` +
        `상담 신청: ${totalLeads}건\n` +
        `등록 전환: ${enrolledLeads}건 (${conversionRate}%)\n` +
        `카톡 발송: ${messagesSent}건\n` +
        `마케팅 동의: ${marketingConsents}명\n\n` +
        `상세 리포트: ${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me'}/${tenantFull.slug}/admin/report`;

      for (const recipient of tenantFull.notifyRecipients) {
        await sendMessage({
          tenantId: tenant.id,
          recipientId: recipient.id,
          recipientHash: hashPhone(recipient.phone),
          phone: recipient.phone,
          kind: 'owner_alert',
          body: summaryBody,
          isAdvertisement: false,
          consent: { marketing: true, night: false },
          requestedAt: now,
        }).catch(() => {});
      }
    }

    generated++;
  }

  return NextResponse.json({ ok: true, month: monthKey, generated, at: now.toISOString() });
}
