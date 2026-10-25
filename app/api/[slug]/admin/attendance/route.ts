import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { parseAttendance } from '@/lib/students/input';

type Params = Promise<{ slug: string }>;

// PUT /api/[slug]/admin/attendance — 하루치 출결 일괄 저장 (원장·실장). 학부모 알림은 보내지 않는다(SPEC 14장)
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;

  const body = await req.json().catch(() => null);
  const parsed = parseAttendance(body ?? {});
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { date, entries } = parsed.data;

  // 다른 학원 학생 id가 섞여 있으면 전체 거절
  const ids = [...new Set(entries.map((e) => e.studentId))];
  const owned = await prisma.student.count({ where: { tenantId: a.tenantId, id: { in: ids } } });
  if (owned !== ids.length) return NextResponse.json({ error: '학생 정보가 올바르지 않습니다.' }, { status: 400 });

  await prisma.$transaction(
    entries.map((e) =>
      e.status === null
        ? prisma.attendance.deleteMany({ where: { tenantId: a.tenantId, studentId: e.studentId, date } })
        : prisma.attendance.upsert({
            where: { studentId_date: { studentId: e.studentId, date } },
            create: { tenantId: a.tenantId, studentId: e.studentId, date, status: e.status, note: e.note, checkedBy: a.email },
            update: { status: e.status, note: e.note, checkedBy: a.email },
          }),
    ),
  );
  return NextResponse.json({ ok: true, saved: entries.length });
}
