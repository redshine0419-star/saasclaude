import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { ResultStatsClient } from './ResultStatsClient';

type Props = { params: Promise<{ slug: string }> };

export default async function AdminResultStatsPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) redirect('/auth/signin');

  const stats = await prisma.resultStat.findMany({
    where: { tenantId: tenant.id },
    orderBy: { id: 'desc' },
  });

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="result-stats" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ResultStatsClient
          slug={slug}
          stats={stats.map((s) => ({
            id: s.id,
            termLabel: s.termLabel,
            metrics: s.metrics as { label: string; value: string; unit: string }[],
            basisText: s.basisText,
            published: s.published,
          }))}
        />
      </main>
    </div>
  );
}
