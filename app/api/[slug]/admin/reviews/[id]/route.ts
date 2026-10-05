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

  const existing = await prisma.review.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '후기를 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const consentConfirmed =
    body.consentConfirmed !== undefined ? body.consentConfirmed === true : existing.consentConfirmed;

  const review = await prisma.review.update({
    where: { id },
    data: {
      body: body.body ?? existing.body,
      authorLabel: body.authorLabel ?? existing.authorLabel,
      source: body.source ?? existing.source,
      consentConfirmed,
      showOnHome: consentConfirmed ? (body.showOnHome ?? existing.showOnHome) : false,
      // 동의 없으면 비공개 강제 (SPEC 절대 원칙 5)
      visible: consentConfirmed,
    },
  });

  return NextResponse.json({
    review: {
      id: review.id,
      kind: review.kind,
      body: review.body,
      authorLabel: review.authorLabel,
      source: review.source,
      consentConfirmed: review.consentConfirmed,
      showOnHome: review.showOnHome,
      visible: review.visible,
    },
  });
}
