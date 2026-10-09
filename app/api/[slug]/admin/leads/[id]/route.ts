import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string; id: string }>;

const VALID_STATUSES = ['new', 'contacted', 'test_booked', 'test_done', 'no_show', 'enrolled', 'not_enrolled'];

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) {
    return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  }

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const lead = await prisma.lead.findFirst({ where: { id, tenantId: tenant.id } });
  if (!lead) {
    return NextResponse.json({ error: '상담을 찾을 수 없습니다.' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const VALID_REASONS = ['비용', '시간', '거리', '타학원', '기타'];
  const updateData: { status?: string; message?: string; statusChangedAt?: Date; notEnrolledReason?: string | null } = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: '잘못된 상태값입니다.' }, { status: 400 });
    }
    updateData.status = body.status;
    updateData.statusChangedAt = new Date();
    if (body.status === 'not_enrolled' && body.notEnrolledReason !== undefined) {
      updateData.notEnrolledReason = VALID_REASONS.includes(body.notEnrolledReason) ? body.notEnrolledReason : null;
    } else if (body.status !== 'not_enrolled') {
      updateData.notEnrolledReason = null;
    }
  }

  if (body.message !== undefined) {
    updateData.message = String(body.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.lead.update({ where: { id }, data: updateData as any });

  if (body.status !== undefined && body.status !== lead.status) {
    await prisma.leadEvent.create({
      data: {
        leadId: id,
        type: 'status_changed',
        payload: { from: lead.status, to: body.status },
        actorId: session.user.email,
      },
    });
  }

  if (body.message !== undefined) {
    await prisma.leadEvent.create({
      data: {
        leadId: id,
        type: 'note',
        payload: { note: String(body.message) },
        actorId: session.user.email,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
