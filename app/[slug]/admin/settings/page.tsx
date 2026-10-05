import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { SettingsClient } from './SettingsClient';

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) redirect('/auth/signin');

  const [recipients, proxyLogs] = await Promise.all([
    prisma.notifyRecipient.findMany({
      where: { tenantId: tenant.id },
      orderBy: { id: 'asc' },
    }),
    prisma.proxyAccessLog.findMany({
      where: { tenantId: tenant.id },
      orderBy: { accessedAt: 'desc' },
      take: 20,
    }),
  ]);

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
          accentColor={tenant.accentColor ?? ''}
          proxyLogs={proxyLogs.map((l) => ({ id: l.id, accessedAt: l.accessedAt.toISOString(), adminEmail: l.adminEmail }))}
        />
      </main>
    </div>
  );
}
