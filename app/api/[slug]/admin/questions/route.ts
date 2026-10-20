import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';
import { parseQuestionInput } from '@/lib/level-test/question-input';

type Params = Promise<{ slug: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const g = await guardAdmin((await params).slug);
  if ('error' in g) return g.error;

  const parsed = parseQuestionInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const q = await prisma.question.create({
    data: { ...parsed.value, choices: (parsed.value.choices ?? undefined) as Prisma.InputJsonValue | undefined, tenantId: g.tenant.id },
  });
  return NextResponse.json({ ok: true, question: q });
}
