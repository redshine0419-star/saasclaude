import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

async function isPlatformAdmin(email: string) {
  const m = await prisma.membership.findFirst({ where: { user: { email }, role: 'platform_admin' } });
  return !!m;
}

// PATCH /api/platform/diagnosis/[id] — 상태 변경 + 결과 메모
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(session.user.email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const valid = ['pending', 'in_review', 'done'];
  if (body.status && !valid.includes(body.status)) {
    return NextResponse.json({ error: '올바르지 않은 상태입니다.' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.resultNote !== undefined) data.resultNote = body.resultNote;
  if (body.scores !== undefined) data.scores = body.scores;

  const updated = await prisma.diagnosticRequest.update({ where: { id }, data });
  return NextResponse.json({ ok: true, request: updated });
}
