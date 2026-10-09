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
  const capacity = body?.capacity != null ? Number(body.capacity) : null;
  const seatsLeft = body?.seatsLeft != null ? Number(body.seatsLeft) : capacity;
  if (capacity !== null && seatsLeft !== null && seatsLeft > capacity) {
    return NextResponse.json({ error: '잔여석은 정원을 초과할 수 없습니다.' }, { status: 400 });
  }
  const cls = await prisma.classItem.create({
    data: {
      tenantId: tenant.id,
      name: body?.name ?? '새 반',
      days: body?.days ?? [],
      startTime: body?.startTime ?? null,
      endTime: body?.endTime ?? null,
      capacity,
      seatsLeft,
    },
  });

  return NextResponse.json({ class: cls });
}
