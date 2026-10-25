import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';

type Params = Promise<{ slug: string; id: string; noteId: string }>;

// DELETE — 본인 메모 또는 원장
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id, noteId } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const note = await prisma.studentNote.findFirst({ where: { id: noteId, studentId: id, tenantId: a.tenantId }, select: { authorEmail: true } });
  if (!note) return NextResponse.json({ error: '메모를 찾을 수 없습니다.' }, { status: 404 });
  if (!a.isOwner && note.authorEmail !== a.email) return NextResponse.json({ error: '다른 사람이 쓴 메모는 원장만 지울 수 있습니다.' }, { status: 403 });
  await prisma.studentNote.deleteMany({ where: { id: noteId, tenantId: a.tenantId } });
  return NextResponse.json({ ok: true });
}
