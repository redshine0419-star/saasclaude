import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string; id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.classItem.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '반을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const cls = await prisma.classItem.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      gradeBand: body.gradeBand ?? existing.gradeBand,
      days: Array.isArray(body.days) ? body.days : existing.days,
      startTime: body.startTime ?? existing.startTime,
      endTime: body.endTime ?? existing.endTime,
      capacity: body.capacity != null ? Number(body.capacity) : existing.capacity,
      textbook: body.textbook ?? existing.textbook,
      description: body.description ?? existing.description,
    },
  });

  return NextResponse.json({ class: cls });
}
