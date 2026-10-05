import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const consentConfirmed = body.consentConfirmed === true;

  const review = await prisma.review.create({
    data: {
      tenantId: tenant.id,
      kind: body.kind === 'score_case' ? 'score_case' : 'review',
      body: body.body ?? null,
      authorLabel: body.authorLabel ?? null,
      source: body.source ?? null,
      consentConfirmed,
      showOnHome: consentConfirmed ? (body.showOnHome === true) : false,
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
