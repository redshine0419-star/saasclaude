import { notFound, redirect } from 'next/navigation';
import { adminSession } from '@/lib/demo-viewer';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { parseMarks } from '@/lib/level-test/marks';
import { formatKstDateTime } from '@/lib/format-date';
import { GradeClient, type EssayItem, type AutoItem } from './GradeClient';

type Props = { params: Promise<{ slug: string; attemptId: string }> };

function maskName(name: string) {
  return name ? `${name[0]}${'○'.repeat(Math.max(1, name.length - 1))}` : '';
}

export default async function GradeAttemptPage({ params }: Props) {
  const { slug, attemptId } = await params;
  const session = await adminSession(slug);
  if (!session?.user?.email) redirect('/auth/signin');
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true } });
  if (!tenant) notFound();
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) redirect('/auth/signin');

  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, tenantId: tenant.id, status: 'submitted' },
    include: {
      test: { include: { items: { orderBy: { sortOrder: 'asc' }, include: { question: true } } } },
      responses: true,
      lead: { select: { parentName: true, studentGrade: true } },
    },
  });
  if (!attempt) notFound();

  const byQ = new Map(attempt.responses.map((r) => [r.questionId, r]));
  const essays: EssayItem[] = [];
  const autos: AutoItem[] = [];
  attempt.test.items.forEach((it, idx) => {
    const r = byQ.get(it.questionId);
    const q = it.question;
    if (q.type === 'essay') {
      essays.push({
        questionId: q.id, no: idx + 1, body: q.body, imageUrl: q.imageUrl, modelAnswer: q.explanation, maxPoints: it.points,
        answer: r?.answer ?? '', photos: r?.photos ?? [], points: r?.points ?? null, feedback: r?.feedback ?? '',
        errorType: r?.errorType ?? '', marks: (r?.photos ?? []).map((_, i) => parseMarks(r?.marks[i])),
      });
    } else {
      const choices = Array.isArray(q.choices) ? (q.choices as string[]) : null;
      const show = (v: string) => (q.type === 'choice' && choices ? `${v}번 ${choices[Number(v) - 1] ?? ''}` : v);
      autos.push({
        no: idx + 1, body: q.body, answer: r?.answer ? show(r.answer) : '(무응답)', key: q.answers.map(show).join(' / '),
        correct: !!r?.correct, points: r?.points ?? 0, maxPoints: it.points,
      });
    }
  });

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="grading" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
        <div style={{ fontSize: 13, color: '#5A6270' }}><a href={`/${slug}/admin/grading`} style={{ color: '#5A6270' }}>채점함</a> / {attempt.test.title}</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{attempt.test.title}</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
            {attempt.lead ? `${maskName(attempt.lead.parentName)} 학부모 · ${attempt.lead.studentGrade ?? '학년 미기재'} · ` : ''}
            {attempt.submittedAt ? `${formatKstDateTime(attempt.submittedAt)} 제출` : ''}
          </div>
        </div>
        <GradeClient
          slug={slug}
          attemptId={attempt.id}
          resultUrl={`/${slug}/test/${attempt.token}/result`}
          needsGrading={attempt.needsGrading}
          essays={essays}
          autos={autos}
        />
      </main>
    </div>
  );
}
