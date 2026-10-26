import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminSession, isDemoViewer } from '@/lib/demo-viewer';
import { DemoReadOnly } from '@/components/admin/DemoReadOnly';
import { prisma } from '@/lib/prisma';
import '@/styles/admin.css';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await adminSession(slug);
  if (!session?.user?.email) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/${slug}/admin`)}`);
  }

  // 데모 학원 둘러보기 (읽기 전용) — 소속·대행 확인 없이 화면만 보여 준다
  if (isDemoViewer(session.user.email)) {
    return (
      <>
        <DemoReadOnly />
        <div className="adm-proxy-banner" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#F2C94C', color: '#1B2430',
          padding: '6px 20px', fontSize: 13, fontWeight: 600,
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <span>데모 둘러보기 — 화면만 볼 수 있고 저장되지 않습니다</span>
          <span style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
            <Link href={`/${slug}`} style={{ color: '#1B2430', fontSize: 12 }}>홈페이지</Link>
            <Link href="/start" style={{ color: '#1B2430', fontSize: 12, fontWeight: 700 }}>무료로 시작하기 →</Link>
          </span>
        </div>
        <div className="adm" style={{ paddingTop: 32 }}>
          {children}
        </div>
      </>
    );
  }

  const isPlatformAdminEmail = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim()).includes(session.user.email);

  // Allow platform_admin proxy access OR regular tenant membership
  const [membership, platformMembership] = await Promise.all([
    prisma.membership.findFirst({
      where: { tenant: { slug }, user: { email: session.user.email } },
    }),
    isPlatformAdminEmail
      ? Promise.resolve({ role: 'platform_admin' } as { role: string })
      : prisma.membership.findFirst({
          where: { user: { email: session.user.email }, role: 'platform_admin' },
        }),
  ]);
  if (!membership && !platformMembership) {
    redirect('/auth/signin');
  }

  const isProxy = !membership && !!platformMembership;

  // Record proxy access for audit log (fire-and-forget, don't block render)
  if (isProxy) {
    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (tenant) {
      prisma.proxyAccessLog.create({
        data: { tenantId: tenant.id, adminEmail: session.user.email! },
      }).catch(() => {});
    }
  }

  return (
    <>
      {isProxy && (
        <div className="adm-proxy-banner" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#1D3FA8', color: '#FFFFFF',
          padding: '6px 20px', fontSize: 13, fontWeight: 600,
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>첫등원 운영자 대행 접속 중 — {slug}</span>
          <Link href="/platform/academies" style={{ color: '#FFF3CC', textDecoration: 'none', fontSize: 12 }}>← 플랫폼으로 돌아가기</Link>
        </div>
      )}
      <div className="adm" style={isProxy ? { paddingTop: 32 } : undefined}>
        {children}
      </div>
    </>
  );
}
