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
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const updates: Array<Promise<unknown>> = [];

  if (body.info) {
    updates.push(
      prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          name: body.info.name ?? tenant.name,
          regNo: body.info.regNo ?? tenant.regNo,
          phone: body.info.phone ?? tenant.phone,
          hours: body.info.hours ?? tenant.hours,
          address: body.info.address ?? tenant.address,
        },
      }),
    );
  }

  if (body.director) {
    updates.push(
      prisma.directorProfile.upsert({
        where: { tenantId: tenant.id },
        update: {
          headline: body.director.headline ?? null,
          career: body.director.career ?? null,
        },
        create: {
          tenantId: tenant.id,
          headline: body.director.headline ?? null,
          career: body.director.career ?? null,
        },
      }),
    );
  }

  if (Array.isArray(body.fees)) {
    for (const fee of body.fees as { id: string; amount: number }[]) {
      if (!fee.id || typeof fee.amount !== 'number') continue;
      updates.push(
        prisma.fee.updateMany({
          where: { id: fee.id, tenantId: tenant.id },
          data: { amount: fee.amount },
        }),
      );
    }
  }

  await Promise.all(updates);

  return NextResponse.json({ ok: true });
}
