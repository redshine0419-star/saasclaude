import { prisma } from '@/lib/prisma';
import { notifyOwner } from '@/lib/notify/owner';
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
    d14: `[더클] ${t.name} 홈페이지 무료 기간이 ${end}에 끝납니다 (14일 남음).`,
    d3: `[더클] ${t.name} 홈페이지 무료 기간이 ${end}에 끝납니다 (3일 남음).`,
    d0: `[더클] ${t.name} 홈페이지 무료 기간이 오늘 끝났습니다.`,
    unpublish7: `[더클] ${t.name} 홈페이지가 ${off}에 비공개로 전환됩니다 (7일 남음).`,
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
 * 원장에게 베타 안내(알림함·앱 알림·이메일)를 보내고 tenants.lifecycleNotices에 기록한다.
 * 받을 번호가 없어도 기록은 남긴다 — 대시보드 배너가 같은 내용을 보여준다.
 */
export async function sendBetaNotice(
  tenant: { id: string; name: string; slug: string; betaEndsAt: Date; lifecycleNotices: unknown },
  key: BetaNoticeKey,
  now: Date,
) {
  const body = betaNoticeBody(key, tenant);
  // 카톡 대신 알림함 + 앱 알림 + 원장 이메일
  const r = await notifyOwner(tenant.id, {
    kind: 'beta',
    title: body.split('\n')[0].replace(/^\[더클\]\s*/, ''),
    body: body.split('\n').slice(2, 4).join('\n'),
    url: `/${tenant.slug}/admin`,
    tag: 'beta',
    email: true,
  });
  const sent = r.pushed + r.emailed;

  const prev = (tenant.lifecycleNotices ?? {}) as Record<string, string>;
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { lifecycleNotices: { ...prev, [key]: now.toISOString() } },
  });

  return { recipients: r.emailed, sent };
}
