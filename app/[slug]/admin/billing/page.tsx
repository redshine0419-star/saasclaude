import { notFound, redirect } from 'next/navigation';
import { adminSession } from '@/lib/demo-viewer';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { PLAN_TIERS, tierFor, tierPrice } from '@/lib/plan-tier';
import { BILLING_IS_MOCK } from '@/lib/billing';
import { BillingClient } from './BillingClient';

type Props = { params: Promise<{ slug: string }> };

export default async function BillingPage({ params }: Props) {
  const { slug } = await params;
  const session = await adminSession(slug);
  if (!session?.user?.email) redirect('/auth/signin');
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true, planStatus: true, betaEndsAt: true } });
  if (!tenant) notFound();
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) redirect('/auth/signin');

  const [activeStudents, priceRows, sub, payments] = await Promise.all([
    prisma.student.count({ where: { tenantId: tenant.id, status: 'active' } }),
    prisma.platformSetting.findMany({ where: { key: { in: ['price_tier_standard', 'price_tier_plus'] } } }),
    prisma.subscription.findUnique({ where: { tenantId: tenant.id } }),
    prisma.payment.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' }, take: 24 }),
  ]);
  const settings = Object.fromEntries(priceRows.map((r) => [r.key, r.value]));
  const tier = tierFor(activeStudents);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="billing" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>결제</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>이용료는 학생부 재원생 수에 따라 정해지고, 등록한 카드로 매월 자동 결제됩니다.</div>
        </div>
        <BillingClient
          slug={slug}
          isMock={BILLING_IS_MOCK}
          isOwner={membership.role === 'owner'}
          planStatus={tenant.planStatus}
          betaEndsAt={tenant.betaEndsAt?.toISOString() ?? null}
          activeStudents={activeStudents}
          tier={{ key: tier.key, label: tier.label, range: tier.range, price: tierPrice(tier.key, settings) }}
          tiers={PLAN_TIERS.map((t) => ({ key: t.key, label: t.label, range: t.range, price: tierPrice(t.key, settings) }))}
          subscription={sub ? { status: sub.status, cardLabel: sub.cardLabel, nextBillingAt: sub.nextBillingAt.toISOString(), failCount: sub.failCount, canceledAt: sub.canceledAt?.toISOString() ?? null } : null}
          payments={payments.map((p) => ({ id: p.id, createdAt: p.createdAt.toISOString(), tierKey: p.tierKey, activeStudents: p.activeStudents, amount: p.amount, status: p.status, failReason: p.failReason, periodStart: p.periodStart.toISOString(), periodEnd: p.periodEnd.toISOString() }))}
        />
      </main>
    </div>
  );
}
