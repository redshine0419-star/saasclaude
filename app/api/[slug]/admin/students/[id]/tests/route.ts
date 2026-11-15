import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/level-test/guard';
import { issueStudentTests } from '@/lib/level-test/student';

type Params = Promise<{ slug: string; id: string }>;

// POST — 재원생 한 명에게 시험 응시 링크 만들기 (보낼 문자에 시험 링크가 올라간다). 원장·실장
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const g = await guardAdmin(slug);
  if ('error' in g) return g.error;
  const student = await prisma.student.findFirst({ where: { id, tenantId: g.tenant.id, status: 'active' }, select: { id: true } });
  if (!student) return NextResponse.json({ error: '재원 중인 학생만 시험을 보낼 수 있습니다.' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const test = await prisma.test.findFirst({ where: { id: String(b.testId ?? ''), tenantId: g.tenant.id, archived: false }, include: { _count: { select: { items: true } } } });
  if (!test) return NextResponse.json({ error: '시험지를 선택해 주세요.' }, { status: 400 });
  if (test._count.items === 0) return NextResponse.json({ error: '문항이 없는 시험지입니다.' }, { status: 400 });
  const [r] = await issueStudentTests(g.tenant.id, test.id, [student.id], g.email);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  return NextResponse.json({ ok: true, attemptId: r.attemptId, reused: r.reused, url: `${base}/${slug}/test/${r.token}` });
}
