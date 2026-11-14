import Link from 'next/link';

export const metadata = { title: '로그인을 다시 해 주세요 — 더클', robots: { index: false } };

// NextAuth 오류 코드 → 안내 문구. Configuration에는 로그인 확인 쿠키 만료·다른 주소에서 시작(InvalidCheck)도 포함된다
const MESSAGES: Record<string, { title: string; body: string }> = {
  AccessDenied: { title: '로그인이 거절되었습니다', body: 'Google 계정 로그인 권한을 확인한 뒤 다시 시도해 주세요.' },
  Verification: { title: '로그인 링크가 만료되었습니다', body: '다시 로그인해 주세요.' },
  Configuration: {
    title: '로그인이 끝나지 않았습니다',
    body: '로그인 화면을 오래 열어 두었거나, 다른 주소(예: www.growweb.me)나 다른 창에서 로그인을 시작하면 이렇게 될 수 있습니다. 아래 버튼으로 다시 로그인해 주세요.',
  },
};

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const m = MESSAGES[error ?? ''] ?? MESSAGES.Configuration;
  return (
    <main data-theme="fd" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", background: '#F7F8FA', color: '#14213D' }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#FFFFFF', border: '1px solid #E3E7EE', borderRadius: 16, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{m.title}</div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#4A5568', wordBreak: 'keep-all' }}>{m.body}</p>
        <a href="/auth/signin?callbackUrl=%2F" style={{ marginTop: 6, height: 50, borderRadius: 12, background: '#14213D', color: '#FFFFFF', textDecoration: 'none', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>다시 로그인</a>
        <Link href="/" style={{ fontSize: 14, color: '#6B7482', textDecoration: 'none' }}>더클 홈으로</Link>
        {error && <div style={{ fontSize: 12, color: '#9AA3AF' }}>오류 코드: {error}</div>}
      </div>
    </main>
  );
}
