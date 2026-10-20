import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';

type Params = Promise<{ slug: string; id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug, id } = await params;
  const g = await guardAdmin(slug);
  if ('error' in g) return g.error;
  const src = await prisma.test.findFirst({ where: { id, tenantId: g.tenant.id }, include: { items: { orderBy: { sortOrder: 'asc' } } } });
  if (!src) return NextResponse.json({ error: '시험지를 찾을 수 없습니다.' }, { status: 404 });
  const copy = await prisma.test.create({
    data: {
      tenantId: g.tenant.id,
      title: `${src.title} (복사본)`.slice(0, 60),
      grade: src.grade,
      description: src.description,
      timeLimitMin: src.timeLimitMin,
      items: { create: src.items.map((i) => ({ questionId: i.questionId, points: i.points, sortOrder: i.sortOrder })) },
    },
  });
  return NextResponse.json({ ok: true, id: copy.id });
}
