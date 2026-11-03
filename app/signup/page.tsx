import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasSignupConsent, safeNext } from '@/lib/legal/consent';
import { SignupStart } from './SignupStart';

export const metadata = { title: '회원가입 — 첫등원' };

type Props = { searchParams: Promise<{ next?: string }> };

// 회원가입: Google로 로그인 → 동의 화면 → 원래 가려던 곳 (기본: 학원 홈페이지 만들기)
export default async function SignupPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);
  const session = await auth();
  if (session?.user?.email) {
    redirect((await hasSignupConsent(session.user.email)) ? next : `/signup/consent?next=${encodeURIComponent(next)}`);
  }
  return <SignupStart next={next} />;
}
