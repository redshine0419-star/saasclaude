import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

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

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (membership.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || (typeof body.enabled !== 'boolean' && typeof body.templateBody !== 'string')) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const validScenarios = ['receipt', 'reminder', 'followup', 'campaign', 'owner_alert', 'owner_reminder', 'reconfirm'];
  if (!validScenarios.includes(scenario)) {
    return NextResponse.json({ error: '잘못된 시나리오입니다.' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scenarioEnum = scenario as any;

  // Template body update (sets reviewStatus to pending)
  if (typeof body.templateBody === 'string') {
    if (body.templateBody.length > 1000) {
      return NextResponse.json({ error: '템플릿 문구는 1000자를 초과할 수 없습니다.' }, { status: 400 });
    }
    const template = await prisma.messageTemplate.upsert({
      where: { tenantId_scenario: { tenantId: tenant.id, scenario: scenarioEnum } },
      update: { body: body.templateBody, reviewStatus: 'pending' },
      create: {
        tenantId: tenant.id,
        scenario: scenarioEnum,
        kind: 'info',
        body: body.templateBody,
        reviewStatus: 'pending',
      },
    });
    return NextResponse.json({ ok: true, reviewStatus: template.reviewStatus });
  }

  // Enabled toggle
  const setting = await prisma.automationSetting.upsert({
    where: { tenantId_scenario: { tenantId: tenant.id, scenario: scenarioEnum } },
    update: { enabled: body.enabled },
    create: { tenantId: tenant.id, scenario: scenarioEnum, enabled: body.enabled },
  });

  return NextResponse.json({ ok: true, enabled: setting.enabled });
}
