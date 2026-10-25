import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { parseStudent } from '@/lib/students/input';

type Params = Promise<{ slug: string; id: string }>;

// PATCH — 기본 정보·성격 태그·요약 수정. 퇴원 처리는 원장만
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;

  const existing = await prisma.student.findFirst({ where: { id, tenantId: a.tenantId }, select: { id: true, status: true } });
  if (!existing) return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const parsed = parseStudent(body, true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const data = parsed.data;

  if (data.status && data.status !== existing.status && (data.status === 'left' || existing.status === 'left') && !a.isOwner) {
    return NextResponse.json({ error: '퇴원 처리는 원장만 할 수 있습니다.' }, { status: 403 });
  }
  if (data.classId && !(await prisma.classItem.findFirst({ where: { id: data.classId, tenantId: a.tenantId }, select: { id: true } }))) {
    return NextResponse.json({ error: '반을 찾을 수 없습니다.' }, { status: 400 });
  }

  const leftAt = data.status === undefined ? undefined : data.status === 'left' ? (existing.status === 'left' ? undefined : new Date()) : null;
  await prisma.student.updateMany({ where: { id, tenantId: a.tenantId }, data: { ...data, ...(leftAt !== undefined && { leftAt }) } });
  return NextResponse.json({ ok: true });
}

// DELETE — 학생부 전체 삭제(메모·성적·출결 포함). 원장만
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  const r = await prisma.student.deleteMany({ where: { id, tenantId: a.tenantId } });
  if (r.count === 0) return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
