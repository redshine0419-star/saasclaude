import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.stop) return NextResponse.json({ error: '정류장명이 필요합니다.' }, { status: 400 });

  const maxOrder = await prisma.shuttleStop.aggregate({
    where: { tenantId: tenant.id },
    _max: { sortOrder: true },
  });

  const stop = await prisma.shuttleStop.create({
    data: {
      tenantId: tenant.id,
      stop: String(body.stop).trim(),
      pickup: body.pickup ? String(body.pickup).trim() || null : null,
      dropoff: body.dropoff ? String(body.dropoff).trim() || null : null,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json({ stop });
}
