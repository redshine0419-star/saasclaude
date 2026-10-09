import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { MobileWriteClient } from './MobileWriteClient';

type Props = { params: Promise<{ slug: string }> };

export default async function AdminMobilePage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) redirect('/auth/signin');

  // count marketing-consented leads who haven't revoked
  const marketingCount = await prisma.consent.count({
    where: {
      tenantId: tenant.id,
      type: 'marketing',
      grantedAt: { not: null },
      revokedAt: null,
    },
  });

  // recent pending leads count for nav badge
  const newLeadsCount = await prisma.lead.count({
    where: { tenantId: tenant.id, status: 'new' },
  });

  return (
    <MobileWriteClient
      slug={slug}
      tenantName={tenant.name}
      marketingCount={marketingCount}
      newLeadsCount={newLeadsCount}
    />
  );
}
