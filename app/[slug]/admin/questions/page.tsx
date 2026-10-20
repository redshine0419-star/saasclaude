import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { QuestionsClient, type QuestionRow } from './QuestionsClient';

type Props = { params: Promise<{ slug: string }> };

export default async function QuestionsPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true, subjects: true } });
  if (!tenant) notFound();
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) redirect('/auth/signin');

  const questions = await prisma.question.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { testItems: true, responses: true } } },
  });

  const rows: QuestionRow[] = questions.map((q) => ({
    id: q.id,
    type: q.type,
    subject: q.subject,
    grade: q.grade,
    unit: q.unit,
    difficulty: q.difficulty,
    body: q.body,
    imageUrl: q.imageUrl,
    choices: Array.isArray(q.choices) ? (q.choices as string[]) : null,
    answers: q.answers,
    explanation: q.explanation,
    points: q.points,
    archived: q.archived,
    usedInTests: q._count.testItems,
    responses: q._count.responses,
  }));

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="questions" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <QuestionsClient slug={slug} initial={rows} defaultSubject={tenant.subjects?.split(/[,·\s]/)[0] || '수학'} />
      </main>
    </div>
  );
}
