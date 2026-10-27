import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';
import { parseManualPoints } from '@/lib/level-test/grading';
import { errorTypesFor, readErrorTypeConfig } from '@/lib/level-test/error-types';
import { validateStrokes } from '@/lib/level-test/marks';
import { recomputeAttemptScore } from '@/lib/level-test/attempt';

type Params = Promise<{ slug: string; attemptId: string }>;

// 서술형 한 문항 채점·첨삭 저장
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, attemptId } = await params;
  const g = await guardAdmin(slug);
  if ('error' in g) return g.error;

  const attempt = await prisma.testAttempt.findFirst({
    where: { id: attemptId, tenantId: g.tenant.id, status: 'submitted' },
    include: { test: { include: { items: { include: { question: { select: { type: true, subject: true } } } } } }, responses: true },
  });
  if (!attempt) return NextResponse.json({ error: '응시를 찾을 수 없습니다.' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const item = attempt.test.items.find((i) => i.questionId === b.questionId);
  if (!item || item.question.type !== 'essay') return NextResponse.json({ error: '서술형 문항만 채점할 수 있습니다.' }, { status: 400 });

  const points = parseManualPoints(b.points, item.points);
  if (points === null) return NextResponse.json({ error: `점수는 0~${item.points} 사이 정수로 입력해 주세요.` }, { status: 400 });
  // 오답 유형: 이 문항 과목에 맞는 학원 목록(없으면 기본 목록) 안에서만
  const tenantCfg = await prisma.tenant.findUnique({ where: { id: g.tenant.id }, select: { errorTypes: true } });
  const allowed = errorTypesFor(item.question.subject, readErrorTypeConfig(tenantCfg?.errorTypes));
  const errorType = typeof b.errorType === 'string' && allowed.includes(b.errorType) ? b.errorType : null;
  const feedback = typeof b.feedback === 'string' && b.feedback.trim() ? b.feedback.trim().slice(0, 1000) : null;

  const existing = attempt.responses.find((r) => r.questionId === item.questionId);
  let marks: string[] | undefined;
  if (Array.isArray(b.marks)) {
    const photoCount = existing?.photos.length ?? 0;
    marks = [];
    for (let i = 0; i < photoCount; i++) {
      const strokes = validateStrokes(b.marks[i] ?? []);
      if (strokes === null) return NextResponse.json({ error: '펜 표시 형식이 올바르지 않습니다.' }, { status: 400 });
      marks.push(strokes.length ? JSON.stringify(strokes) : '');
    }
  }

  const data = { points, correct: points === item.points, errorType, feedback, gradedBy: g.email, ...(marks ? { marks } : {}) };
  await prisma.testResponse.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId: item.questionId } },
    update: data,
    create: { tenantId: g.tenant.id, attemptId: attempt.id, questionId: item.questionId, answer: '', ...data, marks: marks ?? [] },
  });

  // 이미 채점 완료된 응시를 고친 경우 최종 점수를 바로 다시 계산
  if (!attempt.needsGrading) await recomputeAttemptScore(attempt.id, { markComplete: false, actor: g.email });
  return NextResponse.json({ ok: true });
}
