import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';

type Params = Promise<{ slug: string; id: string; reportId: string }>;

// DELETE — 공유 중지: 링크가 바로 열리지 않게 한다 (원장·실장)
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id, reportId } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const r = await prisma.studentReport.updateMany({
    where: { id: reportId, studentId: id, tenantId: a.tenantId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (r.count === 0) return NextResponse.json({ error: '리포트를 찾을 수 없거나 이미 중지되었습니다.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
