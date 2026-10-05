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

  const existing = await prisma.resultStat.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const basisText: string =
    body.basisText !== undefined ? (body.basisText ?? '').trim() : existing.basisText;

  const wantPublish = body.published !== undefined ? body.published === true : existing.published;

  // basisText 없으면 공개 불가 (SPEC line 161)
  if (wantPublish && !basisText) {
    return NextResponse.json({ error: '근거 출처를 입력해야 공개할 수 있습니다.' }, { status: 422 });
  }

  const stat = await prisma.resultStat.update({
    where: { id },
    data: {
      termLabel: body.termLabel !== undefined ? (body.termLabel ?? '').trim() || existing.termLabel : existing.termLabel,
      metrics: body.metrics !== undefined ? body.metrics : existing.metrics,
      basisText,
      published: wantPublish && !!basisText,
    },
  });

  return NextResponse.json({ stat });
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.resultStat.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 });

  await prisma.resultStat.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
