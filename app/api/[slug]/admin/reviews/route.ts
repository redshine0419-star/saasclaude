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

  const kind = body.kind === 'score_case' ? 'score_case' : 'review';
  const consentConfirmed = body.consentConfirmed === true;
  const consentFile: string | null = (body.consentFile ?? '').trim() || null;

  // 성적 사례: consent_file 없으면 공개 불가 (SPEC line 160)
  const visible = consentConfirmed && (kind === 'review' || !!consentFile);

  const review = await prisma.review.create({
    data: {
      tenantId: tenant.id,
      kind,
      body: body.body ?? null,
      authorLabel: body.authorLabel ?? null,
      source: body.source ?? null,
      consentConfirmed,
      consentFile,
      beforeValue: kind === 'score_case' ? (body.beforeValue ?? null) : null,
      afterValue: kind === 'score_case' ? (body.afterValue ?? null) : null,
      periodLabel: kind === 'score_case' ? (body.periodLabel ?? null) : null,
      comment: body.comment ?? null,
      showOnHome: visible ? (body.showOnHome === true) : false,
      visible,
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
      consentFile: review.consentFile,
      beforeValue: review.beforeValue,
      afterValue: review.afterValue,
      periodLabel: review.periodLabel,
      comment: review.comment,
      showOnHome: review.showOnHome,
      visible: review.visible,
    },
  });
}
