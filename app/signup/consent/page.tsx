import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { hasSignupConsent, safeNext } from '@/lib/legal/consent';
import { ConsentForm } from './ConsentForm';

export const metadata = { title: '약관 동의 — 첫등원', robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function ConsentPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);
  const session = await auth();
  if (!session?.user?.email) redirect(`/signup?next=${encodeURIComponent(next)}`);
  if (await hasSignupConsent(session.user.email)) redirect(next);
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { termsAgreedAt: true, marketingAgreedAt: true, marketingRevokedAt: true, promoAgreedAt: true, promoRevokedAt: true } });
  return (
    <ConsentForm
      email={session.user.email}
      next={next}
      renewal={!!user?.termsAgreedAt}
      marketingInitial={!!user?.marketingAgreedAt && !user.marketingRevokedAt}
      promoInitial={!!user?.promoAgreedAt && !user.promoRevokedAt}
    />
  );
}
