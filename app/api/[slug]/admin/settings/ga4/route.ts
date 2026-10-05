import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email }, role: 'owner' },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const measurementId: string = (body?.measurementId ?? '').trim();

  if (measurementId && !/^G-[A-Z0-9]+$/.test(measurementId)) {
    return NextResponse.json({ error: 'GA4 측정 ID는 G-XXXXXXXX 형식이어야 합니다.' }, { status: 400 });
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { ga4MeasurementId: measurementId || null },
  });

  return NextResponse.json({ ok: true, ga4Connected: !!measurementId });
}
