import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { tierFor, tierPrice, PLAN_TIERS } from '@/lib/plan-tier';
import { getBillingAdapter } from './index';
import { addMonth, retryAt } from './schedule';

export type ChargeOutcome = { status: 'paid' | 'failed' | 'skipped'; amount: number; reason?: string };

/**
 * 구독 1건 청구 — 재원생 수로 구간을 바로 정해 그 금액을 결제한다(0원 구간은 결제 없이 다음 달로).
 * 결과는 payments에 남기고, 성공하면 다음 결제일을 한 달 뒤로, 실패하면 재시도 일정을 잡는다.
 */
export async function chargeSubscription(subscriptionId: string, now: Date = new Date()): Promise<ChargeOutcome> {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { tenant: { select: { id: true, name: true } } } });
  if (!sub || sub.status === 'canceled') return { status: 'skipped', amount: 0, reason: 'canceled' };

  const [activeStudents, priceRows] = await Promise.all([
    prisma.student.count({ where: { tenantId: sub.tenantId, status: 'active' } }),
    prisma.platformSetting.findMany({ where: { key: { in: PLAN_TIERS.map((t) => t.priceKey).filter((k): k is string => !!k) } } }),
  ]);
  const tier = tierFor(activeStudents);
  const amount = tierPrice(tier.key, Object.fromEntries(priceRows.map((r) => [r.key, r.value])));
  const periodStart = sub.nextBillingAt;
  const periodEnd = addMonth(periodStart);
  const orderId = `grw_${now.getTime()}_${randomBytes(4).toString('hex')}`;

  if (amount === 0) {
    await prisma.$transaction([
      prisma.payment.create({ data: { tenantId: sub.tenantId, subscriptionId: sub.id, orderId, tierKey: tier.key, activeStudents, amount: 0, status: 'paid', periodStart, periodEnd } }),
      prisma.subscription.update({ where: { id: sub.id }, data: { status: 'active', failCount: 0, nextBillingAt: periodEnd } }),
      prisma.tenant.update({ where: { id: sub.tenantId }, data: { planStatus: 'paid' } }),
    ]);
    return { status: 'skipped', amount: 0, reason: 'free_tier' };
  }

  const result = await getBillingAdapter().charge({ billingKey: sub.billingKey, orderId, amount, orderName: `더클 ${tier.label} (${sub.tenant.name})` });
  if (result.ok) {
    await prisma.$transaction([
      prisma.payment.create({ data: { tenantId: sub.tenantId, subscriptionId: sub.id, orderId, tierKey: tier.key, activeStudents, amount, status: 'paid', periodStart, periodEnd } }),
      prisma.subscription.update({ where: { id: sub.id }, data: { status: 'active', failCount: 0, nextBillingAt: periodEnd } }),
      prisma.tenant.update({ where: { id: sub.tenantId }, data: { planStatus: 'paid' } }),
    ]);
    return { status: 'paid', amount };
  }

  const failCount = sub.failCount + 1;
  const next = retryAt(now, failCount);
  await prisma.$transaction([
    prisma.payment.create({ data: { tenantId: sub.tenantId, subscriptionId: sub.id, orderId, tierKey: tier.key, activeStudents, amount, status: 'failed', failReason: result.reason.slice(0, 200), periodStart, periodEnd } }),
    // 재시도 횟수를 다 쓰면 다음 결제일을 멀리 미뤄 자동 재시도를 멈춘다 — 카드를 다시 등록하면 다시 시작
    prisma.subscription.update({ where: { id: sub.id }, data: { status: 'past_due', failCount, nextBillingAt: next ?? addMonth(now) } }),
  ]);
  return { status: 'failed', amount, reason: result.reason };
}
