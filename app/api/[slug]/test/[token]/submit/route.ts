import { NextResponse } from 'next/server';
import { findAttemptByToken, submitAttempt } from '@/lib/level-test/attempt';

type Params = Promise<{ slug: string; token: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug, token } = await params;
  const attempt = await findAttemptByToken(slug, token);
  if (!attempt) return NextResponse.json({ error: '시험을 찾을 수 없습니다.' }, { status: 404 });
  if (attempt.status === 'issued') return NextResponse.json({ error: '시험을 먼저 시작해 주세요.' }, { status: 409 });
  await submitAttempt(attempt.id);
  return NextResponse.json({ ok: true });
}
