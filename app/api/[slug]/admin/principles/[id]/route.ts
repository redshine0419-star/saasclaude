import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string; id: string }>;

async function authorize(slug: string, email: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return null;
  const membership = await getAdminMembership(tenant.id, email);
  return membership ? tenant : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await authorize(slug, session.user.email);
  if (!tenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.teachingPrinciple.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '원칙을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const principle = await prisma.teachingPrinciple.update({
    where: { id },
    data: {
      number: body.number !== undefined ? String(body.number).trim() : existing.number,
      title: body.title !== undefined ? String(body.title).trim() : existing.title,
      description: body.description !== undefined ? (String(body.description).trim() || null) : existing.description,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder,
    },
  });

  return NextResponse.json({ principle });
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await authorize(slug, session.user.email);
  if (!tenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.teachingPrinciple.deleteMany({ where: { id, tenantId: tenant.id } });

  return NextResponse.json({ ok: true });
}
