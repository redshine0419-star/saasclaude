import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findAttemptByToken } from '@/lib/level-test/attempt';

type Params = Promise<{ slug: string; token: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug, token } = await params;
  const attempt = await findAttemptByToken(slug, token);
  if (!attempt) return NextResponse.json({ error: '시험을 찾을 수 없습니다.' }, { status: 404 });
  if (attempt.status === 'submitted') return NextResponse.json({ error: '이미 제출한 시험입니다.' }, { status: 409 });
  if (attempt.status === 'issued') {
    await prisma.testAttempt.updateMany({ where: { id: attempt.id, status: 'issued' }, data: { status: 'in_progress', startedAt: new Date() } });
  }
  const fresh = await prisma.testAttempt.findUnique({ where: { id: attempt.id }, select: { startedAt: true } });
  return NextResponse.json({ ok: true, startedAt: fresh?.startedAt?.toISOString() ?? null });
}
