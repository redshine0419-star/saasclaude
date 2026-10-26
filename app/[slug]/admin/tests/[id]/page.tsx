import { notFound, redirect } from 'next/navigation';
import { adminSession } from '@/lib/demo-viewer';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { TestBuilderClient, type BuilderQuestion } from './TestBuilderClient';
import { TestResults } from './TestResults';

type Props = { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ tab?: string }> };

export default async function TestDetailPage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { tab } = await searchParams;
  const session = await adminSession(slug);
  if (!session?.user?.email) redirect('/auth/signin');
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true } });
  if (!tenant) notFound();
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) redirect('/auth/signin');

  const test = await prisma.test.findFirst({
    where: { id, tenantId: tenant.id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!test) notFound();

  const [bank, submitted] = await Promise.all([
    prisma.question.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' } }),
    prisma.testAttempt.count({ where: { tenantId: tenant.id, testId: id, status: 'submitted' } }),
  ]);
  const toRow = (q: (typeof bank)[number]): BuilderQuestion => ({
    id: q.id, type: q.type, grade: q.grade, unit: q.unit, difficulty: q.difficulty, body: q.body, points: q.points, archived: q.archived,
  });

  const showResults = tab === 'results';
  const tabStyle = (on: boolean): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: 'none',
    background: on ? '#1B2430' : '#FFFFFF', color: on ? '#FFFFFF' : '#1B2430', border: '1px solid #D5D0C6',
  });

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="tests" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, color: '#5A6270' }}>
          <a href={`/${slug}/admin/tests`} style={{ color: '#5A6270' }}>레벨테스트 시험지</a> / {test.title}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`/${slug}/admin/tests/${id}`} style={tabStyle(!showResults)}>구성</a>
          <a href={`/${slug}/admin/tests/${id}?tab=results`} style={tabStyle(showResults)}>결과·문항 통계 ({submitted})</a>
        </div>
        {showResults ? (
          <TestResults tenantId={tenant.id} testId={id} slug={slug} />
        ) : (
          <TestBuilderClient
            slug={slug}
            test={{ id: test.id, title: test.title, grade: test.grade, description: test.description, timeLimitMin: test.timeLimitMin, archived: test.archived }}
            items={test.items.map((i) => ({ questionId: i.questionId, points: i.points }))}
            bank={bank.map(toRow)}
            locked={submitted > 0}
          />
        )}
      </main>
    </div>
  );
}
