import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { aiDraftAvailable, DRAFT_SOURCE_MAX, generateDraft, type DraftKind } from '@/lib/ai/drafts';

type Params = Promise<{ slug: string }>;

export const maxDuration = 60;
const DAILY_LIMIT = 30;

const POST_CATEGORY_LABEL: Record<string, string> = {
  notice: '공지', recruit: '특강·수강생 모집', exam: '시험 대비', gallery: '수업 사진',
};

function str(v: unknown, max = 100) {
  return typeof v === 'string' ? v.trim().slice(0, max) : undefined;
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true, subjects: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const kind: DraftKind = body?.kind === 'class' || body?.kind === 'post' ? body.kind : 'director';
  // 원장 소개는 원장만, 수업·소식은 실장(staff)도 작성 가능 (SPEC 2장)
  if (kind === 'director' && membership.role !== 'owner') {
    return NextResponse.json({ error: '원장만 사용할 수 있습니다.' }, { status: 403 });
  }
  if (!aiDraftAvailable()) return NextResponse.json({ error: 'AI 초안 기능을 준비 중입니다.' }, { status: 503 });

  const source = typeof body?.source === 'string' ? body.source.trim() : '';
  if (source.length < 20) return NextResponse.json({ error: '참고할 글을 20자 이상 입력해 주세요.' }, { status: 400 });
  if (source.length > DRAFT_SOURCE_MAX) {
    return NextResponse.json({ error: `글이 너무 깁니다. ${DRAFT_SOURCE_MAX.toLocaleString()}자 이내로 줄여 주세요.` }, { status: 400 });
  }

  const ctx = (body?.context ?? {}) as Record<string, unknown>;
  const extra: Record<string, string | undefined> =
    kind === 'class'
      ? { 반이름: str(ctx.name), 대상: str(ctx.gradeBand), 교재: str(ctx.textbook), 요일: str(ctx.days) }
      : kind === 'post'
        ? { 글종류: POST_CATEGORY_LABEL[str(ctx.category, 20) ?? ''] }
        : {};

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await prisma.aiDraftLog.count({ where: { tenantId: tenant.id, createdAt: { gte: since } } });
  if (used >= DAILY_LIMIT) {
    return NextResponse.json({ error: `학원당 하루 ${DAILY_LIMIT}회까지 사용할 수 있습니다. 내일 다시 시도해 주세요.` }, { status: 429 });
  }

  try {
    const result = await generateDraft(kind, source, { academyName: tenant.name, subjects: tenant.subjects, extra });
    if (!result.ok) {
      const msg = result.reason === 'refused'
        ? '이 글로는 초안을 만들 수 없습니다. 다른 내용으로 시도해 주세요.'
        : '초안을 만들지 못했습니다. 다시 시도해 주세요.';
      return NextResponse.json({ error: msg }, { status: 422 });
    }
    await prisma.aiDraftLog.create({
      data: { tenantId: tenant.id, kind, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens },
    });
    return NextResponse.json({ ok: true, draft: result.draft, remaining: DAILY_LIMIT - used - 1 });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: '요청이 많습니다. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      console.error('[ai-draft] API error', e.status);
      return NextResponse.json({ error: '초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
    }
    throw e;
  }
}
