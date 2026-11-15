import { notFound, redirect } from 'next/navigation';
import { adminSession } from '@/lib/demo-viewer';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { TestBuilderClient, type BuilderQuestion } from './TestBuilderClient';
import { TestResults } from './TestResults';
import { StudentSendPanel, type SendStudent } from './StudentSendPanel';

type Props = { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ tab?: string }> };

const ATTEMPT_LABEL: Record<string, string> = { issued: '안 열어 봄', in_progress: '푸는 중', submitted: '제출' };

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
  const showSend = tab === 'send';
  let sendStudents: SendStudent[] = [];
  if (showSend) {
    const [students, attempts] = await Promise.all([
      prisma.student.findMany({ where: { tenantId: tenant.id, status: 'active' }, orderBy: { name: 'asc' }, select: { id: true, name: true, grade: true, studentPhone: true, class: { select: { id: true, name: true } } } }),
      prisma.testAttempt.findMany({ where: { tenantId: tenant.id, testId: id, studentId: { not: null } }, orderBy: { createdAt: 'desc' }, select: { studentId: true, status: true, score: true, maxScore: true, needsGrading: true } }),
    ]);
    const latest = new Map<string, (typeof attempts)[number]>();
    for (const a of attempts) if (a.studentId && !latest.has(a.studentId)) latest.set(a.studentId, a);
    sendStudents = students.map((s) => {
      const a = latest.get(s.id);
      return {
        id: s.id, name: s.name, grade: s.grade, classId: s.class?.id ?? null, className: s.class?.name ?? null, hasPhone: !!s.studentPhone,
        state: !a ? null : a.status === 'submitted' ? (a.needsGrading ? '제출 · 서술형 채점 대기' : `제출 · ${a.score}/${a.maxScore}점`) : ATTEMPT_LABEL[a.status] ?? a.status,
        submitted: a?.status === 'submitted',
      };
    });
  }
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={`/${slug}/admin/tests/${id}`} style={tabStyle(!showResults && !showSend)}>구성</a>
          <a href={`/${slug}/admin/tests/${id}?tab=send`} style={tabStyle(showSend)}>학생에게 보내기</a>
          <a href={`/${slug}/admin/tests/${id}?tab=results`} style={tabStyle(showResults)}>결과·문항 통계 ({submitted})</a>
        </div>
        {showResults ? (
          <TestResults tenantId={tenant.id} testId={id} slug={slug} />
        ) : showSend ? (
          <StudentSendPanel slug={slug} testId={id} testTitle={test.title} students={sendStudents} hasItems={test.items.length > 0} />
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
