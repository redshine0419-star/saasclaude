import { prisma } from '@/lib/prisma';
import { pushToTenant } from '@/lib/push';
import { sendMail } from '@/lib/mail/send';
import { BRAND_NAME } from '@/lib/brand';

/**
 * 원장·직원 알림 — 카카오톡 대신 (1) 관리자 알림함 (2) 앱 알림(푸시) (3) 중요한 알림만 원장 이메일.
 * 앱을 설치하지 않은 원장도 관리자에 들어오면 알림함에서 본다.
 * 내용에 학부모 연락처를 넣지 않는다(개인정보 최소화) — 자세한 건 링크로 관리자에서 본다.
 */
export type OwnerNotice = {
  kind: string;
  title: string;
  body?: string;
  /** 관리자 안의 경로 (/slug/admin/...) */
  url?: string;
  /** 같은 종류 앱 알림은 하나로 묶는다 */
  tag?: string;
  /** 원장 이메일로도 보낸다 (새 상담·무료 기간 종료·결제 실패 등 중요한 것만) */
  email?: boolean;
};

const DEMO = /^demo(-|$)/;
const baseUrl = () => process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function notifyOwner(tenantId: string, n: OwnerNotice): Promise<{ pushed: number; emailed: number }> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true, name: true } });
  if (!tenant) return { pushed: 0, emailed: 0 };

  await prisma.adminNotification.create({
    data: { tenantId, kind: n.kind, title: n.title.slice(0, 120), body: n.body?.slice(0, 500) ?? null, url: n.url ?? null },
  }).catch((e) => console.error('[notify] 알림함 저장 실패', e instanceof Error ? e.message : e));

  const pushed = await pushToTenant(tenantId, { title: n.title, body: n.body ?? '', url: n.url ?? `/${tenant.slug}/admin`, tag: n.tag }).catch(() => 0);

  let emailed = 0;
  if (n.email && !DEMO.test(tenant.slug)) {
    const owners = await prisma.membership.findMany({
      where: { tenantId, role: 'owner' },
      select: { user: { select: { email: true } } },
    });
    const to = [...new Set(owners.map((o) => o.user?.email).filter((e): e is string => !!e))];
    if (to.length > 0) {
      const link = `${baseUrl()}${n.url ?? `/${tenant.slug}/admin`}`;
      const text = [n.title, n.body ?? '', '', `관리자 화면에서 보기: ${link}`, '', `— ${BRAND_NAME}`].join('\n');
      const html = `<div style="font-family:sans-serif;line-height:1.7;color:#1B2430"><p style="font-size:16px;font-weight:700;margin:0 0 8px">${esc(n.title)}</p>${n.body ? `<p style="margin:0 0 16px;white-space:pre-line">${esc(n.body)}</p>` : ''}<p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#1E5645;color:#fff;border-radius:8px;text-decoration:none">관리자 화면에서 보기</a></p><p style="color:#8A93A0;font-size:12px">${esc(tenant.name)} · ${BRAND_NAME} 알림</p></div>`;
      const r = await sendMail({ to, subject: `[${BRAND_NAME}] ${n.title}`, text, html }).catch(() => ({ sent: false }));
      if (r.sent) emailed = to.length;
    }
  }
  return { pushed, emailed };
}

/** 알림함 안 읽은 수 */
export function unreadCount(tenantId: string) {
  return prisma.adminNotification.count({ where: { tenantId, readAt: null } });
}
