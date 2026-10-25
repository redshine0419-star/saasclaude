import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';

type Params = Promise<{ slug: string; id: string; scoreId: string }>;

// DELETE — 본인이 넣은 성적 또는 원장
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id, scoreId } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const score = await prisma.studentScore.findFirst({ where: { id: scoreId, studentId: id, tenantId: a.tenantId }, select: { createdBy: true } });
  if (!score) return NextResponse.json({ error: '성적을 찾을 수 없습니다.' }, { status: 404 });
  if (!a.isOwner && score.createdBy !== a.email) return NextResponse.json({ error: '다른 사람이 넣은 성적은 원장만 지울 수 있습니다.' }, { status: 403 });
  await prisma.studentScore.deleteMany({ where: { id: scoreId, tenantId: a.tenantId } });
  return NextResponse.json({ ok: true });
}
