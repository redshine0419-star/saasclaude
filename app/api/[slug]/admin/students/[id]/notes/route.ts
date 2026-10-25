import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { parseNote } from '@/lib/students/input';

type Params = Promise<{ slug: string; id: string }>;

// POST — 관찰 메모 추가 (원장·실장)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  if (!(await prisma.student.findFirst({ where: { id, tenantId: a.tenantId }, select: { id: true } }))) {
    return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  const parsed = parseNote(body ?? {});
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const note = await prisma.studentNote.create({
    data: { tenantId: a.tenantId, studentId: id, ...parsed.data, authorEmail: a.email, authorName: a.name },
  });
  return NextResponse.json({ ok: true, note });
}
