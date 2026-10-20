import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';
import { recomputeAttemptScore } from '@/lib/level-test/attempt';

type Params = Promise<{ slug: string; attemptId: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug, attemptId } = await params;
  const g = await guardAdmin(slug);
  if ('error' in g) return g.error;
  const attempt = await prisma.testAttempt.findFirst({ where: { id: attemptId, tenantId: g.tenant.id }, select: { id: true } });
  if (!attempt) return NextResponse.json({ error: '응시를 찾을 수 없습니다.' }, { status: 404 });
  const r = await recomputeAttemptScore(attempt.id, { markComplete: true, actor: g.email });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 409 });
  return NextResponse.json(r);
}
