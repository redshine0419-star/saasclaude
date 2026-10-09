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

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const stop = await prisma.shuttleStop.updateMany({
    where: { id, tenantId: tenant.id },
    data: {
      ...(body.stop !== undefined && { stop: String(body.stop).trim() }),
      ...(body.pickup !== undefined && { pickup: body.pickup ? String(body.pickup).trim() || null : null }),
      ...(body.dropoff !== undefined && { dropoff: body.dropoff ? String(body.dropoff).trim() || null : null }),
    },
  });

  return NextResponse.json({ updated: stop.count });
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await authorize(slug, session.user.email);
  if (!tenant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.shuttleStop.deleteMany({ where: { id, tenantId: tenant.id } });

  return NextResponse.json({ ok: true });
}
