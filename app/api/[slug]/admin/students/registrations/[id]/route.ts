import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';

type Params = Promise<{ slug: string; id: string }>;

// POST — 등록 대기 건 승인: 학생부에 재원생으로 옮기고 대기 건은 지운다
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const body = (await req.json().catch(() => ({}))) as { classId?: unknown };

  const reg = await prisma.studentRegistration.findFirst({ where: { id, tenantId: a.tenantId } });
  if (!reg) return NextResponse.json({ error: '등록 대기 건을 찾을 수 없습니다. 이미 처리되었을 수 있습니다.' }, { status: 404 });

  let classId: string | null = null;
  if (typeof body.classId === 'string' && body.classId) {
    const c = await prisma.classItem.findFirst({ where: { id: body.classId, tenantId: a.tenantId }, select: { id: true } });
    if (!c) return NextResponse.json({ error: '반을 찾을 수 없습니다.' }, { status: 400 });
    classId = c.id;
  }

  const consentDay = new Date(`${reg.consentAt.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const [student] = await prisma.$transaction([
    prisma.student.create({
      data: {
        tenantId: a.tenantId,
        name: reg.studentName,
        grade: reg.grade,
        school: reg.school,
        studentPhone: reg.studentPhone,
        parentName: reg.parentName,
        parentPhone: reg.parentPhone,
        summary: reg.memo ? `학부모 전달: ${reg.memo}`.slice(0, 300) : null,
        classId,
        consentAt: consentDay,
        consentMethod: 'electronic',
        createdBy: a.email,
      },
      select: { id: true },
    }),
    prisma.studentRegistration.delete({ where: { id: reg.id } }),
  ]);
  return NextResponse.json({ ok: true, id: student.id });
}

// DELETE — 등록 대기 건 거절: 바로 지운다
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const r = await prisma.studentRegistration.deleteMany({ where: { id, tenantId: a.tenantId } });
  if (r.count === 0) return NextResponse.json({ error: '등록 대기 건을 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
