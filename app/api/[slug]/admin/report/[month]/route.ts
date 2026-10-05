import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string; month: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, month } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const report = await prisma.monthlyReport.upsert({
    where: { tenantId_month: { tenantId: tenant.id, month } },
    update: {
      ...(body.aiCheck !== undefined && { aiCheck: body.aiCheck }),
      ...(body.managerNote !== undefined && { managerNote: body.managerNote }),
    },
    create: {
      tenantId: tenant.id,
      month,
      snapshot: {},
      aiCheck: body.aiCheck ?? null,
      managerNote: body.managerNote ?? null,
    },
  });

  return NextResponse.json({ ok: true, report: { month: report.month, managerNote: report.managerNote } });
}
