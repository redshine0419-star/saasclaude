import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { formatKstDateTime } from '@/lib/format-date';
import { AccountClient } from './AccountClient';

export const metadata = { title: '내 계정 — 더클', robots: { index: false } };

const TYPE_LABEL: Record<string, string> = { age: '만 14세 이상 확인', terms: '이용약관', privacy: '개인정보 수집·이용', marketing: '광고성 정보 수신', promo: '홍보 목적 개인정보 수집·이용' };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/signup?next=/account');
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      consentLogs: { orderBy: { createdAt: 'desc' }, take: 30 },
      memberships: { include: { tenant: { select: { name: true, slug: true } } } },
    },
  });
  if (!user) redirect('/signup/consent?next=/account');

  return (
    <AccountClient
      email={user.email}
      name={user.name}
      joinedAt={formatKstDateTime(user.createdAt)}
      consentAt={user.termsAgreedAt ? formatKstDateTime(user.termsAgreedAt) : null}
      marketing={!!user.marketingAgreedAt && !user.marketingRevokedAt}
      promo={!!user.promoAgreedAt && !user.promoRevokedAt}
      academies={user.memberships.map((m) => ({ name: m.tenant.name, slug: m.tenant.slug, role: m.role === 'owner' ? '원장' : '직원' }))}
      logs={user.consentLogs.map((l) => ({ id: l.id, at: formatKstDateTime(l.createdAt), label: TYPE_LABEL[l.type] ?? l.type, action: l.action === 'agree' ? '동의' : '철회', version: l.version }))}
    />
  );
}
