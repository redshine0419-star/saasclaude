import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chargeSubscription } from '@/lib/billing/charge';
import { sendBillingFailNotice } from '@/lib/billing/notify';
import { MAX_RETRIES } from '@/lib/billing/schedule';

// Vercel Cron: 0 1 * * * — 매일 01:00 UTC (KST 10:00). 결제일이 된 정기결제를 청구한다 (지금은 모의 결제)
export async function GET(req: Request) {
  const authz = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authz !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const now = new Date();
  const due = await prisma.subscription.findMany({
    where: { status: { in: ['active', 'past_due'] }, nextBillingAt: { lte: now } },
    orderBy: { nextBillingAt: 'asc' },
    take: 100,
    include: { tenant: { select: { id: true, name: true, slug: true, status: true } } },
  });

  const results: { tenantId: string; status: string; amount: number }[] = [];
  for (const s of due) {
    if (s.tenant.status !== 'active') continue;
    try {
      const r = await chargeSubscription(s.id, now);
      results.push({ tenantId: s.tenantId, status: r.status, amount: r.amount });
      if (r.status === 'failed') await sendBillingFailNotice(s.tenant, r.amount, s.failCount + 1 < MAX_RETRIES);
    } catch (e) {
      console.error('[cron/billing] charge error', s.tenantId, e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
