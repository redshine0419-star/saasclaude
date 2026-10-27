import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { parseErrorTypeConfig } from '@/lib/level-test/error-types';

type Params = Promise<{ slug: string }>;

// PATCH — 과목별 오답 유형 저장 (원장만). 기본값과 같은 과목은 저장하지 않는다
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership || membership.role !== 'owner') return NextResponse.json({ error: '오답 유형은 원장만 바꿀 수 있습니다.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = parseErrorTypeConfig(body?.errorTypes);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await prisma.tenant.update({ where: { id: tenant.id }, data: { errorTypes: parsed.data as Prisma.InputJsonValue } });
  return NextResponse.json({ ok: true, errorTypes: parsed.data });
}
