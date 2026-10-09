import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';
import { SettingsClient } from './SettingsClient';

export default async function PlatformSettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const isPlatformAdminEmail = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim()).includes(session.user.email);

  if (!isPlatformAdminEmail) {
    const platformMembership = await prisma.membership.findFirst({
      where: { user: { email: session.user.email }, role: 'platform_admin' },
    });
    if (!platformMembership) redirect('/');
  }

  const [rows, recentProxyLogs] = await Promise.all([
    prisma.platformSetting.findMany(),
    prisma.proxyAccessLog.findMany({
      orderBy: { accessedAt: 'desc' },
      take: 50,
      include: { tenant: { select: { name: true, slug: true } } },
    }),
  ]);
  const initialSettings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const proxyLogs = recentProxyLogs.map((l) => ({
    id: l.id,
    accessedAt: l.accessedAt.toISOString(),
    adminEmail: l.adminEmail,
    tenantName: l.tenant.name,
    tenantSlug: l.tenant.slug,
  }));

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="settings" />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          color: '#1B2430',
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
          background: '#F4F2EE',
          minHeight: '100vh',
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>플랫폼 설정</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
            첫등원 서비스 전체 운영 기준값을 관리합니다.
          </div>
        </div>

        <SettingsClient initialSettings={initialSettings} proxyLogs={proxyLogs} />
      </main>
    </div>
  );
}
