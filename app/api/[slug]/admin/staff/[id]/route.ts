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

  const existing = await prisma.staffProfile.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '강사를 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const staff = await prisma.staffProfile.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      roleLabel: body.roleLabel !== undefined ? body.roleLabel : existing.roleLabel,
      photo: body.photo !== undefined ? body.photo : existing.photo,
      summary: body.summary !== undefined ? body.summary : existing.summary,
      sortOrder: body.sortOrder !== undefined ? body.sortOrder : existing.sortOrder,
    },
  });

  return NextResponse.json({ staff });
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.staffProfile.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '강사를 찾을 수 없습니다.' }, { status: 404 });

  await prisma.staffProfile.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
