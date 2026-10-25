import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { parseStudent } from '@/lib/students/input';

type Params = Promise<{ slug: string }>;

// POST /api/[slug]/admin/students — 학생 등록 (상담 건에서 등록하면 leadId로 학부모 정보·학년을 채운다)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const parsed = parseStudent(body, false);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const data = parsed.data;
  if (data.status === 'left' && !a.isOwner) return NextResponse.json({ error: '퇴원 처리는 원장만 할 수 있습니다.' }, { status: 403 });

  if (data.classId && !(await prisma.classItem.findFirst({ where: { id: data.classId, tenantId: a.tenantId }, select: { id: true } }))) {
    return NextResponse.json({ error: '반을 찾을 수 없습니다.' }, { status: 400 });
  }

  let leadId: string | null = null;
  if (typeof body.leadId === 'string' && body.leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: body.leadId, tenantId: a.tenantId },
      select: { id: true, parentName: true, phone: true, studentGrade: true, school: true, student: { select: { id: true } } },
    });
    if (!lead) return NextResponse.json({ error: '상담 건을 찾을 수 없습니다.' }, { status: 404 });
    if (lead.student) return NextResponse.json({ error: '이미 원생으로 등록된 상담입니다.', studentId: lead.student.id }, { status: 409 });
    leadId = lead.id;
    data.parentName ??= lead.parentName;
    data.parentPhone ??= lead.phone;
    data.grade ??= lead.studentGrade;
    data.school ??= lead.school;
  }

  const student = await prisma.student.create({
    data: { ...data, name: data.name!, tenantId: a.tenantId, leadId, createdBy: a.email },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: student.id });
}
