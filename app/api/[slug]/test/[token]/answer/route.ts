import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findAttemptByToken, isPastDeadline } from '@/lib/level-test/attempt';

type Params = Promise<{ slug: string; token: string }>;

// 답을 고를 때마다 자동 저장 — 새로고침·연결 끊김에도 답이 남는다
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { slug, token } = await params;
  const attempt = await findAttemptByToken(slug, token);
  if (!attempt) return NextResponse.json({ error: '시험을 찾을 수 없습니다.' }, { status: 404 });
  if (attempt.status !== 'in_progress') return NextResponse.json({ error: '진행 중인 시험이 아닙니다.' }, { status: 409 });
  if (isPastDeadline(attempt.startedAt, attempt.test.timeLimitMin, new Date())) {
    return NextResponse.json({ error: '제한 시간이 지났습니다.', expired: true }, { status: 409 });
  }

  const b = await req.json().catch(() => ({}));
  const questionId = String(b.questionId ?? '');
  const answer = typeof b.answer === 'string' ? b.answer.slice(0, 200) : '';
  if (!attempt.test.items.some((i) => i.questionId === questionId)) {
    return NextResponse.json({ error: '시험에 없는 문항입니다.' }, { status: 400 });
  }

  if (!answer.trim()) {
    await prisma.testResponse.deleteMany({ where: { attemptId: attempt.id, questionId } });
  } else {
    await prisma.testResponse.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
      update: { answer },
      create: { tenantId: attempt.tenantId, attemptId: attempt.id, questionId, answer },
    });
  }
  return NextResponse.json({ ok: true });
}
