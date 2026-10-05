import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

async function isPlatformAdmin(email: string) {
  const m = await prisma.membership.findFirst({ where: { user: { email }, role: 'platform_admin' } });
  return !!m;
}

// PATCH /api/platform/queue/[id] — 신청 상태 변경, 예상 시작일, 오픈 처리
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(session.user.email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 });

  const validStatuses = ['applied', 'waiting_docs', 'in_progress', 'review', 'ready'];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: '올바르지 않은 상태입니다.' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.expectedStartDate !== undefined) {
    data.expectedStartDate = body.expectedStartDate ? new Date(body.expectedStartDate) : null;
  }

  const updated = await prisma.application.update({ where: { id }, data });

  // "오픈" 처리: ready 상태이고 tenantSlug가 제공되면 betaStartedAt을 기록
  if (body.status === 'ready' && body.tenantSlug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: body.tenantSlug } });
    if (tenant && !tenant.betaStartedAt) {
      const betaStartedAt = new Date();
      const betaEndsAt = new Date(betaStartedAt);
      betaEndsAt.setMonth(betaEndsAt.getMonth() + 3);
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { betaStartedAt, betaEndsAt, status: 'active' },
      });
    }
  }

  return NextResponse.json({ ok: true, application: updated });
}
