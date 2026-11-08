import { notFound, redirect } from 'next/navigation';
import { AppNotifyCard } from './AppNotifyCard';
import { pushPublicKey } from '@/lib/push';
import { SiteControlCard } from './SiteControlCard';
import { adminSession } from '@/lib/demo-viewer';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { SettingsClient } from './SettingsClient';
import { DomainCard } from './DomainCard';
import { getDomainAdapter } from '@/lib/domains/adapter';
import { requiredDnsRecords } from '@/lib/domains/validate';
import { formatWon, tierFor, tierPrice } from '@/lib/plan-tier';

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await adminSession(slug);
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();
  const pushDevices = await prisma.pushDevice.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'asc' } });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) redirect('/auth/signin');

  const [recipients, proxyLogs, allMembers, pendingInvites, activeStudents, priceRows] = await Promise.all([
    prisma.notifyRecipient.findMany({
      where: { tenantId: tenant.id },
      orderBy: { id: 'asc' },
    }),
    prisma.proxyAccessLog.findMany({
      where: { tenantId: tenant.id },
      orderBy: { accessedAt: 'desc' },
      take: 20,
    }),
    prisma.membership.findMany({
      where: { tenantId: tenant.id },
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.memberInvite.findMany({
      where: { tenantId: tenant.id, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.student.count({ where: { tenantId: tenant.id, status: 'active' } }),
    prisma.platformSetting.findMany({ where: { key: { in: ['price_tier_standard', 'price_tier_plus'] } } }),
  ]);
  const tier = tierFor(activeStudents);
  const tierInfo = {
    students: activeStudents,
    label: tier.label,
    range: tier.range,
    price: formatWon(tierPrice(tier.key, Object.fromEntries(priceRows.map((r) => [r.key, r.value])))),
  };

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: '100vh',
        background: '#F4F2EE',
        color: '#1B2430',
        fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
      }}
    >
      <AdminSide slug={slug} tenantName={tenant.name} active="settings" />
      <main
        style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>설정</h1>
        <div style={{ fontSize: 14, color: '#5A6270', marginTop: -8 }}>새 상담 알림 받을 번호, 직원 초대, 카카오·GA4 연결 상태 등 학원 설정을 관리합니다.</div>
        <SettingsClient
          slug={slug}
          recipients={recipients.map((r) => ({ id: r.id, name: r.name, phone: r.phone }))}
          userEmail={session.user.email}
          kakaoConnected={!!process.env.KAKAO_API_KEY}
          ga4Connected={!!tenant.ga4MeasurementId}
          ga4MeasurementId={tenant.ga4MeasurementId ?? ''}
          naverVerified={!!tenant.naverSiteVerification}
          plan={tenant.planStatus}
          betaEndsAt={tenant.betaEndsAt?.toISOString() ?? null}
          tierInfo={tierInfo}
          accentColor={tenant.accentColor ?? ''}
          proxyLogs={proxyLogs.map((l) => ({ id: l.id, accessedAt: l.accessedAt.toISOString(), adminEmail: l.adminEmail }))}
          isOwner={membership.role === 'owner'}
          members={allMembers.map((m) => ({ id: m.id, email: m.user.email ?? '', name: m.user.name, role: m.role }))}
          pendingInvites={pendingInvites.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt.toISOString(), inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me'}/auth/accept-invite?token=${i.token}` }))}
        />
        <AppNotifyCard
          slug={slug}
          isOwner={membership.role === 'owner'}
          myEmail={session.user.email}
          vapidKey={pushPublicKey()}
          devices={pushDevices.map((d) => ({ id: d.id, label: d.label, email: d.email, createdAt: d.createdAt.toISOString(), lastUsedAt: d.lastUsedAt?.toISOString() ?? null }))}
          pushReplacesKakao={tenant.pushReplacesKakao}
        />
        <SiteControlCard
          slug={slug}
          tenantName={tenant.name}
          isOwner={membership.role === 'owner'}
          published={tenant.published}
          unpublishedAt={tenant.unpublishedAt?.toISOString() ?? null}
          deletionRequestedAt={tenant.deletionRequestedAt?.toISOString() ?? null}
        />
        {membership.role === 'owner' && (
          <DomainCard
            slug={slug}
            available={getDomainAdapter() !== null}
            domain={tenant.customDomain}
            status={tenant.customDomainStatus}
            records={tenant.customDomain ? requiredDnsRecords(tenant.customDomain) : []}
          />
        )}
      </main>
    </div>
  );
}
