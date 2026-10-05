import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { LeadsClient } from './LeadsClient';

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) redirect('/auth/signin');

  const leads = await prisma.lead.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      events: { orderBy: { createdAt: 'asc' } },
      consents: { where: { type: 'marketing' } },
    },
  });

  // Count by status for filter tabs
  const totalByStatus: Record<string, number> = {};
  for (const l of leads) {
    totalByStatus[l.status] = (totalByStatus[l.status] ?? 0) + 1;
  }

  const serialized = leads.map((l) => ({
    id: l.id,
    createdAt: l.createdAt.toISOString(),
    parentName: l.parentName,
    phone: l.phone,
    studentGrade: l.studentGrade,
    consultType: l.consultType,
    source: l.source,
    status: l.status,
    statusChangedAt: l.statusChangedAt.toISOString(),
    message: l.message,
    marketingConsent: l.consents.some((c) => c.grantedAt !== null && c.revokedAt === null),
    events: l.events.map((e) => ({
      id: e.id,
      type: e.type,
      createdAt: e.createdAt.toISOString(),
      payload: e.payload,
    })),
  }));

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: '100vh',
        background: '#F4F2EE',
        color: '#1B2430',
        fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
      }}
    >
      <AdminSide slug={slug} tenantName={tenant.name} active="leads" />
      <main
        style={{
          flex: 1,
          padding: '32px 0 32px 40px',
          display: 'flex',
          gap: 24,
          overflow: 'hidden',
        }}
      >
        <LeadsClient slug={slug} leads={serialized} totalByStatus={totalByStatus} />
      </main>
    </div>
  );
}
