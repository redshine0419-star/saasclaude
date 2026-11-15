import { prisma } from '@/lib/prisma';
import { notifyOwner } from '@/lib/notify/owner';

const DAY = 24 * 60 * 60 * 1000;
// 이보다 오래된 미응대 신청은 사실상 방치된 건으로 보고 독촉 대상에서 뺀다
const LOOKBACK_DAYS = 30;

function kstDateParts(d: Date) {
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate(), dayIndex: Math.floor(k.getTime() / DAY) };
}

/** "어제 (10월 14일)", "3일 전 (10월 12일)" 처럼 KST 날짜 기준으로 표시 */
export function oldestLabel(oldest: Date, now: Date): string {
  const a = kstDateParts(oldest);
  const diff = kstDateParts(now).dayIndex - a.dayIndex;
  const date = `${a.m}월 ${a.d}일`;
  if (diff <= 0) return `오늘 (${date})`;
  if (diff === 1) return `어제 (${date})`;
  return `${diff}일 전 (${date})`;
}

export type DigestOutcome = { slug: string; count: number; recipients: number; sent: number } | { slug: string; skipped: string };

export async function runOwnerDigest(now: Date): Promise<DigestOutcome[]> {
  const since = new Date(now.getTime() - LOOKBACK_DAYS * DAY);
  const groups = await prisma.lead.groupBy({
    by: ['tenantId'],
    where: { status: 'new', createdAt: { gte: since }, tenant: { status: 'active', NOT: { slug: { startsWith: 'demo' } } } },
    _count: { _all: true },
    _min: { createdAt: true },
  });
  if (groups.length === 0) return [];

  const outcomes: DigestOutcome[] = [];

  for (const g of groups) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: g.tenantId },
      select: {
        id: true, slug: true, name: true,
        automationSettings: { where: { scenario: 'owner_reminder' }, select: { enabled: true } },
      },
    });
    if (!tenant) continue;
    // 기본은 켜짐. 원장이 A-03에서 끈 경우만 건너뛴다
    if (tenant.automationSettings[0]?.enabled === false) { outcomes.push({ slug: tenant.slug, skipped: 'disabled' }); continue; }
    // 크론 재시도 등으로 같은 날 두 번 알리지 않는다
    const already = await prisma.adminNotification.count({
      where: { tenantId: tenant.id, kind: 'unanswered', createdAt: { gte: new Date(now.getTime() - 20 * 60 * 60 * 1000) } },
    });
    if (already > 0) { outcomes.push({ slug: tenant.slug, skipped: 'already_sent' }); continue; }
    // 카톡 대신 알림함 + 앱 알림
    const r = await notifyOwner(tenant.id, {
      kind: 'unanswered',
      title: `답하지 않은 상담 ${g._count._all}건 — ${tenant.name}`,
      body: g._min.createdAt ? `가장 오래된 신청: ${oldestLabel(g._min.createdAt, now)}. 빨리 연락할수록 등록으로 이어질 가능성이 높습니다.` : '빨리 연락할수록 등록으로 이어질 가능성이 높습니다.',
      url: `/${tenant.slug}/admin/leads`,
      tag: 'owner-digest',
    });
    outcomes.push({ slug: tenant.slug, count: g._count._all, recipients: 0, sent: r.pushed });
  }
  return outcomes;
}
