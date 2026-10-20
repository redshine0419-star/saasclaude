import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';
import { parseQuestionInput } from '@/lib/level-test/question-input';

type Params = Promise<{ slug: string; id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const g = await guardAdmin(slug);
  if ('error' in g) return g.error;

  const existing = await prisma.question.findFirst({ where: { id, tenantId: g.tenant.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: '문항을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  // 보관/복원만 바꾸는 요청
  if (body && typeof body.archived === 'boolean' && Object.keys(body).length === 1) {
    await prisma.question.update({ where: { id }, data: { archived: body.archived } });
    return NextResponse.json({ ok: true });
  }

  const parsed = parseQuestionInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // 이미 응시 기록이 있는 문항의 정답을 바꾸면 과거 채점과 어긋나므로 경고만 돌려준다 (저장은 허용)
  const answered = await prisma.testResponse.count({ where: { questionId: id, tenantId: g.tenant.id } });
  const q = await prisma.question.update({
    where: { id },
    data: { ...parsed.value, choices: parsed.value.choices ?? Prisma.DbNull },
  });
  return NextResponse.json({ ok: true, question: q, warning: answered > 0 ? `이미 ${answered}건의 응답이 있는 문항입니다. 정답을 바꿔도 지난 채점 결과는 바뀌지 않습니다.` : null });
}
