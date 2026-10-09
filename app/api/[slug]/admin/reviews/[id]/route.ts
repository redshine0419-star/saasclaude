import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string; id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.review.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: '후기를 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const consentConfirmed =
    body.consentConfirmed !== undefined ? body.consentConfirmed === true : existing.consentConfirmed;

  const consentFile: string | null =
    body.consentFile !== undefined
      ? (body.consentFile ?? '').trim() || null
      : existing.consentFile;

  // 성적 사례: consent_file 없으면 공개 불가 (SPEC line 160)
  const visible = consentConfirmed && (existing.kind === 'review' || !!consentFile);

  const review = await prisma.review.update({
    where: { id },
    data: {
      body: body.body !== undefined ? body.body : existing.body,
      authorLabel: body.authorLabel !== undefined ? body.authorLabel : existing.authorLabel,
      source: body.source !== undefined ? body.source : existing.source,
      consentConfirmed,
      consentFile,
      beforeValue: existing.kind === 'score_case'
        ? (body.beforeValue !== undefined ? body.beforeValue : existing.beforeValue)
        : null,
      afterValue: existing.kind === 'score_case'
        ? (body.afterValue !== undefined ? body.afterValue : existing.afterValue)
        : null,
      periodLabel: existing.kind === 'score_case'
        ? (body.periodLabel !== undefined ? body.periodLabel : existing.periodLabel)
        : null,
      comment: body.comment !== undefined ? body.comment : existing.comment,
      showOnHome: visible ? (body.showOnHome !== undefined ? body.showOnHome : existing.showOnHome) : false,
      visible,
      gradeBand: body.gradeBand !== undefined ? (body.gradeBand ?? null) : existing.gradeBand,
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
      gradeBand: review.gradeBand,
    },
  });
}
