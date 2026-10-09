import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership || membership.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const stats = await prisma.resultStat.findMany({
    where: { tenantId: tenant.id },
    orderBy: { id: 'desc' },
  });

  return NextResponse.json({ stats });
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership || membership.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const termLabel: string = (body.termLabel ?? '').trim();
  if (!termLabel) return NextResponse.json({ error: '기간 레이블을 입력해주세요.' }, { status: 400 });

  const basisText: string = (body.basisText ?? '').trim();
  const wantPublish = body.published === true;

  // basisText 없으면 공개 불가 (SPEC line 161)
  if (wantPublish && !basisText) {
    return NextResponse.json({ error: '근거 출처를 입력해야 공개할 수 있습니다.' }, { status: 422 });
  }

  const stat = await prisma.resultStat.create({
    data: {
      tenantId: tenant.id,
      termLabel,
      metrics: body.metrics ?? [],
      basisText,
      published: wantPublish && !!basisText,
    },
  });

  return NextResponse.json({ stat });
}
