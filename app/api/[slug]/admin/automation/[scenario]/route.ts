import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string; scenario: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, scenario } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
  });
  if (!tenant) {
    return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  }

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const validScenarios = ['receipt', 'reminder', 'followup', 'campaign', 'owner_alert', 'reconfirm'];
  if (!validScenarios.includes(scenario)) {
    return NextResponse.json({ error: '잘못된 시나리오입니다.' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenarioEnum = scenario as any;

  const setting = await prisma.automationSetting.upsert({
    where: { tenantId_scenario: { tenantId: tenant.id, scenario: scenarioEnum } },
    update: { enabled: body.enabled },
    create: { tenantId: tenant.id, scenario: scenarioEnum, enabled: body.enabled },
  });

  return NextResponse.json({ ok: true, enabled: setting.enabled });
}
