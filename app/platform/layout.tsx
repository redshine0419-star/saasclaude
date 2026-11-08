import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import '@/styles/admin.css';
import { requireSignupConsent } from '@/lib/legal/consent';
import { PwaRegister } from '@/components/admin/PwaRegister';
import type { Metadata, Viewport } from 'next';

// 운영자 앱(PWA) — 휴대폰 홈 화면에 "첫등원 운영"으로 설치
export const metadata: Metadata = {
  manifest: '/api/platform/manifest',
  appleWebApp: { capable: true, title: '첫등원 운영', statusBarStyle: 'default' },
  icons: { apple: '/api/app-icon?size=180' },
};
export const viewport: Viewport = { themeColor: '#1B2430' };

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');
  await requireSignupConsent(session.user.email, '/platform');

  const isPlatformAdminEmail = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',').map(e => e.trim()).includes(session.user.email);

  if (!isPlatformAdminEmail) {
    const platformMembership = await prisma.membership.findFirst({
      where: { user: { email: session.user.email }, role: 'platform_admin' },
    });
    if (!platformMembership) redirect('/');
  }

  return (
    <div className="adm" style={{ display: 'flex', minHeight: '100vh', background: '#F4F2EE', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      {children}
      <PwaRegister />
    </div>
  );
}
