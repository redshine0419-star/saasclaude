import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';

type Params = Promise<{ slug: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const g = await guardAdmin((await params).slug);
  if ('error' in g) return g.error;
  const b = await req.json().catch(() => ({}));
  const title = typeof b.title === 'string' ? b.title.trim().slice(0, 60) : '';
  if (!title) return NextResponse.json({ error: '시험지 이름을 입력해 주세요.' }, { status: 400 });
  const test = await prisma.test.create({
    data: {
      tenantId: g.tenant.id,
      title,
      grade: typeof b.grade === 'string' && b.grade.trim() ? b.grade.trim().slice(0, 20) : null,
      timeLimitMin: Number.isInteger(b.timeLimitMin) && b.timeLimitMin > 0 ? Math.min(b.timeLimitMin, 240) : null,
    },
  });
  return NextResponse.json({ ok: true, id: test.id });
}
