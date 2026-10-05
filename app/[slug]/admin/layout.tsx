import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Allow platform_admin proxy access OR regular tenant membership
  const [membership, platformMembership] = await Promise.all([
    prisma.membership.findFirst({
      where: { tenant: { slug }, user: { email: session.user.email } },
    }),
    prisma.membership.findFirst({
      where: { user: { email: session.user.email }, role: 'platform_admin' },
    }),
  ]);
  if (!membership && !platformMembership) {
    redirect('/auth/signin');
  }

  const isProxy = !membership && !!platformMembership;

  return (
    <>
      {isProxy && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#1D3FA8', color: '#FFFFFF',
          padding: '6px 20px', fontSize: 13, fontWeight: 600,
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>첫등원 운영자 대행 접속 중 — {slug}</span>
          <a href="/platform/academies" style={{ color: '#FFF3CC', textDecoration: 'none', fontSize: 12 }}>← 플랫폼으로 돌아가기</a>
        </div>
      )}
      <div style={isProxy ? { paddingTop: 32 } : undefined}>
        {children}
      </div>
    </>
  );
}
