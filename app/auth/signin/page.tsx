import { SignInButton } from './SignInButton';

// 외부 주소로의 오픈 리다이렉트를 막기 위해 같은 사이트의 경로만 허용한다.
function safeCallback(raw: string | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/';
  return raw;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const target = safeCallback(callbackUrl);
  const subtitle = target.startsWith('/start') ? '학원 홈페이지 만들기 — 먼저 로그인해 주세요' : '원장·직원 로그인';
  return <SignInButton callbackUrl={target} subtitle={subtitle} />;
}
