import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';
import { issueStudentTests } from '@/lib/level-test/student';

type Params = Promise<{ slug: string; id: string }>;

// POST — 여러 재원생에게 시험 보내기: 학생마다 다른 응시 링크 + 보낼 문자. 원장·실장
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const g = await guardAdmin(slug);
  if ('error' in g) return g.error;
  const test = await prisma.test.findFirst({ where: { id, tenantId: g.tenant.id, archived: false }, include: { _count: { select: { items: true } } } });
  if (!test) return NextResponse.json({ error: '시험지를 찾을 수 없습니다.' }, { status: 404 });
  if (test._count.items === 0) return NextResponse.json({ error: '문항이 없는 시험지입니다.' }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const ids = Array.isArray(b.studentIds) ? b.studentIds.filter((x: unknown): x is string => typeof x === 'string').slice(0, 300) : [];
  if (ids.length === 0) return NextResponse.json({ error: '학생을 골라 주세요.' }, { status: 400 });
  const out = await issueStudentTests(g.tenant.id, test.id, ids, g.email);
  return NextResponse.json({ ok: true, issued: out.filter((o) => !o.reused).length, reused: out.filter((o) => o.reused).length });
}
