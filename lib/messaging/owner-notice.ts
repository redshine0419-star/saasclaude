import { prisma } from '@/lib/prisma';
import { sendMessage } from '@/lib/messaging/send';
import { hashPhone } from '@/lib/messaging/hash';
import { betaStatus, formatKstDate, type BetaNoticeKey } from '@/lib/beta';

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
}

export function betaNoticeBody(key: BetaNoticeKey, t: { name: string; slug: string; betaEndsAt: Date }): string {
  const s = betaStatus(t.betaEndsAt, t.betaEndsAt);
  const end = formatKstDate(t.betaEndsAt);
  const off = formatKstDate(s.unpublishAt);
  const admin = `${baseUrl()}/${t.slug}/admin`;
  const head: Record<BetaNoticeKey, string> = {
    d14: `[첫등원] ${t.name} 홈페이지 무료 기간이 ${end}에 끝납니다 (14일 남음).`,
    d3: `[첫등원] ${t.name} 홈페이지 무료 기간이 ${end}에 끝납니다 (3일 남음).`,
    d0: `[첫등원] ${t.name} 홈페이지 무료 기간이 오늘 끝났습니다.`,
    unpublish7: `[첫등원] ${t.name} 홈페이지가 ${off}에 비공개로 전환됩니다 (7일 남음).`,
  };
  return [
    head[key],
    '',
    `종료 후 ${off}까지는 그대로 공개되고, 그 뒤 비공개로 전환됩니다.`,
    '계속 이용하시려면 관리자 화면에서 "계속 이용 신청"을 눌러 주세요. 상담 기록은 언제든 내보낼 수 있습니다.',
    '',
    admin,
  ].join('\n');
}

/**
 * 원장(새 상담 알림 받는 번호)에게 베타 안내를 보내고 tenants.lifecycleNotices에 기록한다.
 * 받을 번호가 없어도 기록은 남긴다 — 대시보드 배너가 같은 내용을 보여준다.
 */
export async function sendBetaNotice(
  tenant: { id: string; name: string; slug: string; betaEndsAt: Date; lifecycleNotices: unknown },
  key: BetaNoticeKey,
  now: Date,
) {
  const recipients = await prisma.notifyRecipient.findMany({ where: { tenantId: tenant.id }, select: { phone: true } });
  const body = betaNoticeBody(key, tenant);

  let sent = 0;
  for (const r of recipients) {
    const result = await sendMessage({
      tenantId: tenant.id,
      recipientId: '',
      recipientHash: hashPhone(r.phone),
      phone: r.phone,
      kind: 'beta_notice',
      body,
      isAdvertisement: false,
      consent: { marketing: false, night: false },
      requestedAt: now,
    });
    if (result.dispatched && 'status' in result && result.status === 'sent') sent++;
  }

  const prev = (tenant.lifecycleNotices ?? {}) as Record<string, string>;
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { lifecycleNotices: { ...prev, [key]: now.toISOString() } },
  });

  return { recipients: recipients.length, sent };
}
