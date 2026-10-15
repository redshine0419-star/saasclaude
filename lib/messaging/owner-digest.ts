import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';
import { fillTemplate, resolveTemplate } from '@/lib/messaging/templates';

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  const outcomes: DigestOutcome[] = [];

  for (const g of groups) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: g.tenantId },
      select: {
        id: true, slug: true, name: true,
        notifyRecipients: { select: { phone: true } },
        automationSettings: { where: { scenario: 'owner_reminder' }, select: { enabled: true } },
      },
    });
    if (!tenant) continue;
    // 기본은 켜짐. 원장이 A-03에서 끈 경우만 건너뛴다
    if (tenant.automationSettings[0]?.enabled === false) { outcomes.push({ slug: tenant.slug, skipped: 'disabled' }); continue; }
    if (tenant.notifyRecipients.length === 0) { outcomes.push({ slug: tenant.slug, skipped: 'no_recipients' }); continue; }

    // 크론 재시도 등으로 같은 날 두 번 보내지 않는다
    const already = await prisma.message.count({
      where: { tenantId: tenant.id, scenario: 'owner_reminder', createdAt: { gte: new Date(now.getTime() - 20 * 60 * 60 * 1000) } },
    });
    if (already > 0) { outcomes.push({ slug: tenant.slug, skipped: 'already_sent' }); continue; }

    const template = await resolveTemplate(tenant.id, 'owner_reminder');
    if (!template) { outcomes.push({ slug: tenant.slug, skipped: 'no_template' }); continue; }

    const body = fillTemplate(template.body, {
      학원명: tenant.name,
      미응대건수: String(g._count._all),
      가장오래된신청: g._min.createdAt ? oldestLabel(g._min.createdAt, now) : '',
      관리자링크: `${baseUrl}/${tenant.slug}/admin/leads`,
    });

    let sent = 0;
    for (const r of tenant.notifyRecipients) {
      const recipientHash = hashPhone(r.phone);
      const result = await sendMessage({
        tenantId: tenant.id,
        recipientId: '',
        recipientHash,
        phone: r.phone,
        kind: 'owner_reminder',
        body,
        isAdvertisement: false,
        consent: { marketing: false, night: false },
        requestedAt: now,
      });
      const ok = result.dispatched && 'status' in result && result.status === 'sent';
      if (ok) sent++;
      await prisma.message.create({
        data: {
          tenantId: tenant.id,
          scenario: 'owner_reminder',
          kind: 'info',
          recipientHash,
          status: ok ? 'sent' : result.dispatched && result.scheduledAt > now ? 'deferred' : 'failed',
          scheduledAt: result.dispatched ? result.scheduledAt : null,
          sentAt: ok ? now : null,
          error: !result.dispatched ? result.reason : 'status' in result && result.status === 'failed' ? result.error : null,
        },
      });
    }
    outcomes.push({ slug: tenant.slug, count: g._count._all, recipients: tenant.notifyRecipients.length, sent });
  }
  return outcomes;
}
