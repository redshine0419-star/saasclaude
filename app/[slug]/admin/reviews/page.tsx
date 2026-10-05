import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { ReviewsClient } from './ReviewsClient';

export default async function AdminReviewsPage({
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

  const [reviews, resultStats] = await Promise.all([
    prisma.review.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.resultStat.findMany({
      where: { tenantId: tenant.id },
      orderBy: { id: 'desc' },
    }),
  ]);

  const serialized = reviews.map((r) => ({
    id: r.id,
    kind: r.kind,
    body: r.body,
    authorLabel: r.authorLabel,
    source: r.source,
    consentConfirmed: r.consentConfirmed,
    consentFile: r.consentFile,
    beforeValue: r.beforeValue,
    afterValue: r.afterValue,
    periodLabel: r.periodLabel,
    comment: r.comment,
    showOnHome: r.showOnHome,
    visible: r.visible,
  }));

  const serializedStats = resultStats.map((s) => ({
    id: s.id,
    termLabel: s.termLabel,
    metrics: s.metrics as { label: string; value: string; unit: string }[],
    basisText: s.basisText,
    published: s.published,
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
      <AdminSide slug={slug} tenantName={tenant.name} active="reviews" />
      <main
        style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <ReviewsClient slug={slug} reviews={serialized} resultStats={serializedStats} />
      </main>
    </div>
  );
}
