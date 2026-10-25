import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { studentPageAuth } from '@/lib/students/page-auth';
import { dateOnlyString, daysAgo, kstToday } from '@/lib/format-date';
import { StudentProfile } from './StudentProfile';

type Props = { params: Promise<{ slug: string; id: string }> };

export default async function StudentPage({ params }: Props) {
  const { slug, id } = await params;
  const { tenant, email, isOwner } = await studentPageAuth(slug);

  const since = daysAgo(120);
  const [student, classes] = await Promise.all([
    prisma.student.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        class: { select: { id: true, name: true, days: true, startTime: true, endTime: true } },
        notes: { where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' }, take: 300 },
        scores: { where: { tenantId: tenant.id }, orderBy: [{ examDate: 'asc' }, { createdAt: 'asc' }] },
        attendances: { where: { tenantId: tenant.id, date: { gte: since } }, orderBy: { date: 'desc' } },
        lead: {
          select: {
            createdAt: true,
            consultType: true,
            message: true,
            events: { orderBy: { createdAt: 'asc' }, select: { id: true, type: true, createdAt: true, payload: true } },
            testAttempts: {
              where: { tenantId: tenant.id, status: 'submitted' },
              orderBy: { submittedAt: 'desc' },
              select: { id: true, token: true, score: true, maxScore: true, needsGrading: true, submittedAt: true, test: { select: { title: true } } },
            },
          },
        },
      },
    }),
    prisma.classItem.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
  ]);
  if (!student) notFound();

  const data = {
    id: student.id,
    name: student.name,
    grade: student.grade ?? '',
    school: student.school ?? '',
    classId: student.classId ?? '',
    className: student.class?.name ?? null,
    classSchedule: student.class ? [student.class.days.join('·'), [student.class.startTime, student.class.endTime].filter(Boolean).join('~')].filter(Boolean).join(' ') : null,
    status: student.status,
    enrolledAt: dateOnlyString(student.enrolledAt),
    consentAt: student.consentAt ? dateOnlyString(student.consentAt) : null,
    consentMethod: student.consentMethod,
    parentName: student.parentName ?? '',
    parentPhone: student.parentPhone ?? '',
    studentPhone: student.studentPhone ?? '',
    traits: student.traits,
    summary: student.summary ?? '',
    notes: student.notes.map((n) => ({ id: n.id, createdAt: n.createdAt.toISOString(), kind: n.kind, body: n.body, authorEmail: n.authorEmail, authorName: n.authorName })),
    scores: student.scores.map((s) => ({
      id: s.id, kind: s.kind, examDate: dateOnlyString(s.examDate), label: s.label, subject: s.subject,
      score: s.score, maxScore: s.maxScore, rankGrade: s.rankGrade, percentile: s.percentile, memo: s.memo, createdBy: s.createdBy,
    })),
    attendances: student.attendances.map((a) => ({ date: dateOnlyString(a.date), status: a.status, note: a.note })),
    lead: student.lead
      ? {
          createdAt: student.lead.createdAt.toISOString(),
          message: student.lead.message,
          events: student.lead.events.map((e) => ({ id: e.id, type: e.type, createdAt: e.createdAt.toISOString(), note: (e.payload as { note?: string } | null)?.note ?? null })),
          attempts: student.lead.testAttempts.map((a) => ({
            id: a.id, title: a.test.title, score: a.score, maxScore: a.maxScore, needsGrading: a.needsGrading,
            submittedAt: a.submittedAt?.toISOString() ?? null, resultUrl: `/${slug}/test/${a.token}/result`,
          })),
        }
      : null,
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="students" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', maxWidth: 1180 }}>
        <StudentProfile slug={slug} student={data} classes={classes} me={email} isOwner={isOwner} today={kstToday()} />
      </main>
    </div>
  );
}
