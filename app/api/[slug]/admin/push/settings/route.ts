import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';

type Params = Promise<{ slug: string }>;

// PATCH { pushReplacesKakao } — 앱 알림을 받는 기기가 있으면 카톡 알림을 보내지 않을지 (원장만)
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  const body = await req.json().catch(() => null);
  if (typeof body?.pushReplacesKakao !== 'boolean') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  await prisma.tenant.update({ where: { id: a.tenantId }, data: { pushReplacesKakao: body.pushReplacesKakao } });
  return NextResponse.json({ ok: true });
}
