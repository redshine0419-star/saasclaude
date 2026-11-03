'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';

export function SignupStart({ next }: { next: string }) {
  return (
    <main data-theme="fd" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#F3F5F8', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", color: '#14213D' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8A6400' }}>첫등원</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 24 }}>회원가입</h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#4A5568', lineHeight: 1.7 }}>
            Google 계정으로 가입합니다. 로그인한 뒤 이용약관과 개인정보 수집·이용 동의를 받습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: `/signup/consent?next=${encodeURIComponent(next)}` })}
          style={{ height: 52, borderRadius: 12, border: '1px solid #D5D9E0', background: '#FFFFFF', font: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 가입하기
        </button>
        <div style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7 }}>
          이미 가입했다면 같은 버튼으로 로그인됩니다. <Link href="/terms" style={{ color: '#14213D' }}>이용약관</Link> · <Link href="/privacy" style={{ color: '#14213D' }}>개인정보처리방침</Link>
        </div>
      </div>
    </main>
  );
}
