import { after, NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { notifyOperator } from '@/lib/mail/operator';
import { pushToOperators } from '@/lib/push';
import { EVENTS, canSubmit, parseClaimInput } from '@/lib/events';

type Params = Promise<{ slug: string }>;

// POST /api/[slug]/admin/events — 원장의 무료 기간 이벤트 신청 (개선 제안 · 블로그 소개글)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true, slug: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  if (/^demo(-|$)/.test(tenant.slug)) return NextResponse.json({ error: '데모 학원에서는 신청할 수 없습니다.' }, { status: 403 });

  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership || membership.role !== 'owner') return NextResponse.json({ error: '원장만 신청할 수 있습니다.' }, { status: 403 });

  const limited = await rateLimit(req, 'event-claim', { limit: 10, windowSec: 3600, key: tenant.id });
  if (limited) return limited;

  const parsed = parseClaimInput(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;

  const existing = await prisma.eventClaim.findMany({ where: { tenantId: tenant.id, kind: input.kind }, select: { kind: true, status: true } });
  const allowed = canSubmit(existing, input.kind);
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: 409 });

  const ev = EVENTS[input.kind];
  const claim = await prisma.eventClaim.create({
    data: {
      tenantId: tenant.id,
      kind: input.kind,
      months: ev.months,
      content: input.kind === 'feedback' ? input.content : null,
      url: input.kind === 'blog' ? input.url : null,
      disclosureAgreedAt: input.kind === 'blog' ? new Date() : null,
      submittedBy: session.user.email,
    },
    select: { id: true },
  });

  after(() =>
    notifyOperator({
      subject: `[더클] 이벤트 신청 — ${ev.title} (${tenant.name})`,
      heading: `이벤트 신청이 들어왔습니다 — ${ev.title}`,
      rows: [
        ['학원', `${tenant.name} (growweb.me/${tenant.slug})`],
        ['이벤트', `${ev.title} · 승인하면 ${ev.months}개월 무료`],
        input.kind === 'feedback' ? ['개선 제안', input.content.slice(0, 1500)] : ['블로그 글', input.url],
      ],
      linkPath: '/platform/events',
      linkLabel: '확인하고 승인하기',
    }),
  );
  after(() => pushToOperators({ title: `이벤트 신청 — ${tenant.name}`, body: `${ev.title} (${ev.months}개월)`, url: '/platform/events', tag: 'op-event' }).catch(() => 0));

  return NextResponse.json({ ok: true, id: claim.id });
}
