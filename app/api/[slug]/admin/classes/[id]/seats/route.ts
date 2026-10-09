import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string; id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.classItem.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '반을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const delta = Number(body?.delta ?? 0);
  if (![-1, 1].includes(delta)) {
    return NextResponse.json({ error: 'delta는 -1 또는 1이어야 합니다.' }, { status: 400 });
  }

  const current = existing.seatsLeft ?? 0;
  const next = Math.max(0, current + delta);

  const cls = await prisma.classItem.update({
    where: { id },
    data: { seatsLeft: next },
  });

  return NextResponse.json({ seatsLeft: cls.seatsLeft });
}
