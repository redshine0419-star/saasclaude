import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CONSENT_VERSION } from './documents';

/** 회원가입 필수 동의가 끝났는지 (현재 문서 버전 기준) */
export async function hasSignupConsent(email: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { email }, select: { termsAgreedAt: true, privacyAgreedAt: true, ageConfirmedAt: true, consentVersion: true } });
  return !!(u?.termsAgreedAt && u.privacyAgreedAt && u.ageConfirmedAt && u.consentVersion === CONSENT_VERSION);
}

/** 화면 서버 컴포넌트에서: 동의 전이면 동의 화면으로 보낸다 */
export async function requireSignupConsent(email: string, next: string): Promise<void> {
  if (!(await hasSignupConsent(email))) redirect(`/signup/consent?next=${encodeURIComponent(next)}`);
}

/** 같은 사이트 경로만 (오픈 리다이렉트 방지) */
export function safeNext(raw: string | undefined | null, fallback = '/start'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}
