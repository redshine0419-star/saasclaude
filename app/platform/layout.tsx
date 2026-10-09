import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F2EE', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      {children}
    </div>
  );
}
