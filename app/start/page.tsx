import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';
import { StartClient } from './StartClient';

export const metadata = {
  title: '학원 홈페이지 만들기 — 첫등원',
  description: '학원 정보를 입력하고 테마를 고르면 바로 홈페이지가 열립니다.',
};

export default async function StartPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin?callbackUrl=/start');

  const isPlatformAdmin = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',').map((e) => e.trim()).includes(session.user.email);

  const owned = await prisma.membership.findMany({
    where: { role: 'owner', user: { email: session.user.email } },
    select: { tenant: { select: { slug: true, name: true } } },
  });

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D', minHeight: '100vh' }}>
      <FdHeader active="apply" />
      <main style={{ padding: 'clamp(32px, 5vw, 64px) 16px', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.5px' }}>학원 홈페이지 만들기</h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: '#4A5568' }}>
            학원 정보를 입력하고 테마를 고르면 바로 홈페이지가 열립니다. 원장 소개·수업·교습비는 관리자 화면에서 이어서 채우면 됩니다.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
            직접 입력할 시간이 없으신가요? <Link href="/apply" style={{ color: '#1D3FA8', fontWeight: 600 }}>제작 대행 신청</Link>
          </p>
        </div>

        {owned.length > 0 && !isPlatformAdmin ? (
          <div style={{ padding: 24, borderRadius: 16, border: '1px solid #E3E7EE', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>이미 만든 학원 홈페이지가 있습니다</div>
            {owned.map(({ tenant }) => (
              <div key={tenant.slug} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{tenant.name}</span>
                <Link href={`/${tenant.slug}/admin`} style={{ color: '#1D3FA8', fontWeight: 600 }}>관리자로 가기 →</Link>
                <Link href={`/${tenant.slug}`} target="_blank" style={{ color: '#4A5568' }}>홈페이지 보기</Link>
              </div>
            ))}
          </div>
        ) : (
          <StartClient />
        )}
      </main>
      <FdFooter />
    </div>
  );
}
