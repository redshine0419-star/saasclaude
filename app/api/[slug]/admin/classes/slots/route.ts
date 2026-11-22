import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const weekday = Number(body?.weekday);
  const time = typeof body?.time === 'string' ? body.time.trim() : '';
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return NextResponse.json({ error: '요일을 골라 주세요.' }, { status: 400 });
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NextResponse.json({ error: '시간을 18:00처럼 넣어 주세요.' }, { status: 400 });
  const dup = await prisma.levelTestSlot.findFirst({ where: { tenantId: tenant.id, weekday, time, active: true }, select: { id: true } });
  if (dup) return NextResponse.json({ error: '이미 있는 시간입니다.' }, { status: 409 });
  const slot = await prisma.levelTestSlot.create({
    data: { tenantId: tenant.id, weekday, time, active: true },
  });

  return NextResponse.json({ slot: { id: slot.id, weekday: slot.weekday, time: slot.time, active: slot.active } });
}
