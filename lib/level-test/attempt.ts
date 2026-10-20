import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { gradeAttempt } from './grading';

/** 응시·결과 링크용 토큰 (192비트, URL 안전) */
export function newAttemptToken(): string {
  return randomBytes(24).toString('base64url');
}

/** 제한 시간이 지나도 네트워크 지연을 감안해 잠시 받아준다 */
export const GRACE_MS = 60 * 1000;

export function deadlineOf(startedAt: Date | null, timeLimitMin: number | null): Date | null {
  if (!startedAt || !timeLimitMin) return null;
  return new Date(startedAt.getTime() + timeLimitMin * 60 * 1000);
}

export function isPastDeadline(startedAt: Date | null, timeLimitMin: number | null, now: Date): boolean {
  const d = deadlineOf(startedAt, timeLimitMin);
  return !!d && now.getTime() > d.getTime() + GRACE_MS;
}

/** 토큰과 학원 slug가 함께 맞을 때만 찾는다 (다른 학원 주소로 열 수 없게) */
export function findAttemptByToken(slug: string, token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return Promise.resolve(null);
  return prisma.testAttempt.findFirst({
    where: { token, tenant: { slug } },
    include: {
      test: { include: { items: { orderBy: { sortOrder: 'asc' }, include: { question: true } } } },
      responses: true,
      tenant: { select: { id: true, name: true, slug: true, phone: true, kakaoChannelUrl: true } },
    },
  });
}

const PROGRESSING = new Set(['new', 'contacted', 'test_booked']);

/**
 * 채점·저장하고 상담 상태를 "테스트 완료"로 바꾼다. 이미 제출됐으면 아무것도 하지 않는다.
 * 저장된 응답(자동 저장분)만으로 채점하므로, 마감 후 들어온 답은 반영되지 않는다.
 */
export async function submitAttempt(attemptId: string, now = new Date()) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: { include: { items: { orderBy: { sortOrder: 'asc' }, include: { question: true } } } },
      responses: true,
      lead: { select: { id: true, status: true } },
    },
  });
  if (!attempt || attempt.status === 'submitted') return attempt;

  // 서술형은 글 없이 사진만 올려도 답한 것으로 본다
  const responses = Object.fromEntries(attempt.responses.map((r) => [r.questionId, r.answer || (r.photos.length ? '(사진 답안)' : '')]));
  const result = gradeAttempt(
    attempt.test.items.map((i) => ({ question: { id: i.questionId, type: i.question.type, answers: i.question.answers, unit: i.question.unit }, points: i.points })),
    responses,
  );

  // 동시에 두 번 제출돼도 한 번만 처리되게 상태 조건부 갱신
  const claimed = await prisma.testAttempt.updateMany({
    where: { id: attempt.id, status: { not: 'submitted' } },
    data: { status: 'submitted', submittedAt: now, score: result.score, maxScore: result.maxScore, startedAt: attempt.startedAt ?? now, needsGrading: result.pending > 0 },
  });
  if (claimed.count === 0) return attempt;

  await prisma.$transaction(
    result.items.map((g) =>
      prisma.testResponse.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: g.questionId } },
        // 서술형(correct=null)은 점수도 비워 두고 선생님 채점을 기다린다
        update: { correct: g.correct, points: g.correct === null ? null : g.points },
        create: { tenantId: attempt.tenantId, attemptId: attempt.id, questionId: g.questionId, answer: g.answer ?? '', correct: g.correct, points: g.correct === null ? null : g.points },
      }),
    ),
  );

  if (attempt.lead) {
    const pct = result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0;
    await prisma.leadEvent.create({
      data: {
        leadId: attempt.lead.id,
        type: 'note',
        payload: {
          note: result.pending > 0
            ? `레벨테스트 제출: ${attempt.test.title} — 자동 채점 ${result.score}점, 서술형 ${result.pending}문항 채점 대기`
            : `레벨테스트 제출: ${attempt.test.title} ${result.score}/${result.maxScore}점 (${pct}%)`,
        },
        actorId: 'system:level-test',
      },
    });
    if (PROGRESSING.has(attempt.lead.status)) {
      await prisma.lead.update({ where: { id: attempt.lead.id }, data: { status: 'test_done', statusChangedAt: now } });
      await prisma.leadEvent.create({
        data: { leadId: attempt.lead.id, type: 'status_changed', payload: { from: attempt.lead.status, to: 'test_done' }, actorId: 'system:level-test' },
      });
    }
  }
  return attempt;
}
