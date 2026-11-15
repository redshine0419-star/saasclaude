import { prisma } from '@/lib/prisma';
import { newAttemptToken } from './attempt';

/**
 * 재원생에게 시험 보내기 — 학생마다 다른 응시 링크를 만들고 '보낼 문자'에 시험 링크 문자를 올린다.
 * 같은 시험을 아직 제출하지 않은 학생에게 다시 보내면 새로 만들지 않고 기존 링크를 쓴다.
 */
export async function issueStudentTests(tenantId: string, testId: string, studentIds: string[], issuedBy: string) {
  const students = await prisma.student.findMany({
    where: { tenantId, id: { in: studentIds.slice(0, 300) }, status: 'active' },
    select: { id: true, name: true },
  });
  const out: { studentId: string; attemptId: string; token: string; reused: boolean }[] = [];
  for (const s of students) {
    const open = await prisma.testAttempt.findFirst({
      where: { tenantId, testId, studentId: s.id, status: { not: 'submitted' } },
      select: { id: true, token: true },
    });
    const attempt = open ?? (await prisma.testAttempt.create({ data: { tenantId, testId, studentId: s.id, token: newAttemptToken(), issuedBy }, select: { id: true, token: true } }));
    const hasTask = await prisma.smsTask.count({ where: { tenantId, attemptId: attempt.id, status: 'todo' } });
    if (!hasTask) {
      await prisma.smsTask.create({ data: { tenantId, studentId: s.id, attemptId: attempt.id, kind: 'test_link', refKey: attempt.id, dueAt: new Date() } });
    }
    out.push({ studentId: s.id, attemptId: attempt.id, token: attempt.token, reused: !!open });
  }
  return out;
}

const KST = 9 * 3600 * 1000;
const kstDate = (d: Date) => {
  const k = new Date(d.getTime() + KST);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()));
};

/**
 * 재원생이 제출·채점된 온라인 시험 점수를 학생부 성적(학원 테스트)에 넣는다 — 같은 응시는 한 줄만(다시 채점하면 고쳐 씀).
 * 과목은 시험지 문항의 과목 중 가장 많은 것, 없으면 학원 교습과목 첫 번째.
 */
export async function syncStudentScore(attemptId: string) {
  const a = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true, tenantId: true, studentId: true, status: true, score: true, maxScore: true, needsGrading: true, submittedAt: true,
      test: { select: { title: true, items: { select: { question: { select: { subject: true } } } } } },
      tenant: { select: { subjects: true } },
    },
  });
  if (!a || !a.studentId || a.status !== 'submitted' || a.score === null || !a.maxScore) return null;
  const count = new Map<string, number>();
  for (const i of a.test.items) if (i.question.subject) count.set(i.question.subject, (count.get(i.question.subject) ?? 0) + 1);
  const subject = [...count.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? a.tenant.subjects?.split(/[,·/\s]+/).filter(Boolean)[0] ?? '학원 테스트';
  const data = {
    kind: 'academy' as const,
    examDate: kstDate(a.submittedAt ?? new Date()),
    label: a.test.title.slice(0, 60),
    subject,
    score: a.score,
    maxScore: a.maxScore,
    memo: a.needsGrading ? '온라인 시험 — 서술형 채점 전 점수' : '온라인 시험 (자동 기록)',
  };
  return prisma.studentScore.upsert({
    where: { attemptId: a.id },
    update: data,
    create: { ...data, tenantId: a.tenantId, studentId: a.studentId, attemptId: a.id, createdBy: 'system:online-test' },
  });
}
