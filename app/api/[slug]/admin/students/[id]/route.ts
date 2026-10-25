import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { parseStudent } from '@/lib/students/input';

type Params = Promise<{ slug: string; id: string }>;

// PATCH — 기본 정보·상태(재원/휴원)·성격 태그·요약·동의 기록 수정 (원장·실장)
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;

  const existing = await prisma.student.findFirst({ where: { id, tenantId: a.tenantId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const parsed = parseStudent(body, true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const data = parsed.data;

  if (data.classId && !(await prisma.classItem.findFirst({ where: { id: data.classId, tenantId: a.tenantId }, select: { id: true } }))) {
    return NextResponse.json({ error: '반을 찾을 수 없습니다.' }, { status: 400 });
  }

  await prisma.student.updateMany({ where: { id, tenantId: a.tenantId }, data });
  return NextResponse.json({ ok: true });
}

// DELETE — 퇴원 처리: 학생부를 즉시 파기한다(메모·성적·출결 CASCADE). 보관하지 않는다(SPEC 14장). 원장만
// 입학 전 상담 기록(Lead)은 상담 관리 소관이라 남는다 — 연결만 끊긴다
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  const r = await prisma.student.deleteMany({ where: { id, tenantId: a.tenantId } });
  if (r.count === 0) return NextResponse.json({ error: '학생을 찾을 수 없습니다.' }, { status: 404 });
  // 파기 기록 — 이름·연락처는 남기지 않는다
  console.log('[students] withdrawn and purged', { tenantId: a.tenantId, studentId: id, by: a.isOwner ? 'owner' : 'staff' });
  return NextResponse.json({ ok: true });
}
