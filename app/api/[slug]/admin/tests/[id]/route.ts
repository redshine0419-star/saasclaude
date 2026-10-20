import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';

type Params = Promise<{ slug: string; id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const g = await guardAdmin(slug);
  if ('error' in g) return g.error;

  const test = await prisma.test.findFirst({ where: { id, tenantId: g.tenant.id }, include: { items: true } });
  if (!test) return NextResponse.json({ error: '시험지를 찾을 수 없습니다.' }, { status: 404 });
  const b = await req.json().catch(() => ({}));

  const data: { title?: string; grade?: string | null; description?: string | null; timeLimitMin?: number | null; archived?: boolean } = {};
  if (typeof b.title === 'string') {
    const t = b.title.trim().slice(0, 60);
    if (!t) return NextResponse.json({ error: '시험지 이름을 입력해 주세요.' }, { status: 400 });
    data.title = t;
  }
  if (b.grade !== undefined) data.grade = typeof b.grade === 'string' && b.grade.trim() ? b.grade.trim().slice(0, 20) : null;
  if (b.description !== undefined) data.description = typeof b.description === 'string' && b.description.trim() ? b.description.trim().slice(0, 500) : null;
  if (b.timeLimitMin !== undefined) data.timeLimitMin = Number.isInteger(b.timeLimitMin) && b.timeLimitMin > 0 ? Math.min(b.timeLimitMin, 240) : null;
  if (typeof b.archived === 'boolean') data.archived = b.archived;

  if (Array.isArray(b.items)) {
    // 응시가 끝난 시험지의 문항을 바꾸면 이전 점수와 비교할 수 없게 된다
    const submitted = await prisma.testAttempt.count({ where: { testId: id, tenantId: g.tenant.id, status: 'submitted' } });
    if (submitted > 0) {
      return NextResponse.json({ error: '이미 응시한 학생이 있어 문항을 바꿀 수 없습니다. "복사해서 새로 만들기"를 이용해 주세요.' }, { status: 409 });
    }
    const items = (b.items as { questionId?: unknown; points?: unknown }[])
      .filter((i) => typeof i?.questionId === 'string')
      .slice(0, 100)
      .map((i, idx) => ({ questionId: i.questionId as string, points: Math.min(100, Math.max(1, Math.round(Number(i.points) || 1))), sortOrder: idx }));
    if (new Set(items.map((i) => i.questionId)).size !== items.length) {
      return NextResponse.json({ error: '같은 문항이 두 번 들어 있습니다.' }, { status: 400 });
    }
    // 다른 학원 문항을 끼워 넣지 못하게 tenantId로 확인
    const owned = await prisma.question.count({ where: { tenantId: g.tenant.id, id: { in: items.map((i) => i.questionId) } } });
    if (owned !== items.length) return NextResponse.json({ error: '문항을 찾을 수 없습니다.' }, { status: 400 });

    await prisma.$transaction([
      prisma.test.update({ where: { id }, data }),
      prisma.testItem.deleteMany({ where: { testId: id } }),
      prisma.testItem.createMany({ data: items.map((i) => ({ ...i, testId: id })) }),
    ]);
  } else if (Object.keys(data).length) {
    await prisma.test.update({ where: { id }, data });
  }
  return NextResponse.json({ ok: true });
}
