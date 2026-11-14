import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

/**
 * 관리자 앱(PWA) 웹 푸시 — 원장·직원에게 가는 알림을 카카오 알림톡 대신 무료 푸시로 보낸다.
 * VAPID 키(VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)가 없으면 아무것도 보내지 않고, 호출하는 쪽은 알림톡으로 보낸다.
 * 학부모에게 가는 알림은 여기로 오지 않는다 (학부모는 앱을 설치하지 않으므로 알림톡 유지).
 */

export type PushPayload = {
  title: string;
  body: string;
  /** 알림을 누르면 열 주소 (같은 사이트 경로) */
  url: string;
  /** 같은 종류 알림은 하나로 묶는다 */
  tag?: string;
};

let configured: boolean | null = null;
export function pushConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:redshine0419@gmail.com', pub, priv);
  return (configured = true);
}

export function pushPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/** 학원의 알림 받는 기기 모두에게 보낸다. 만료된 구독(404·410)은 지운다. 보낸 기기 수를 돌려준다 */
export async function pushToTenant(tenantId: string, payload: PushPayload, opts: { email?: string } = {}): Promise<number> {
  if (!pushConfigured()) return 0;
  const devices = await prisma.pushDevice.findMany({ where: { tenantId, ...(opts.email && { email: opts.email }) } });
  if (devices.length === 0) return 0;
  const body = JSON.stringify({ ...payload, title: payload.title.slice(0, 80), body: payload.body.slice(0, 300) });
  let delivered = 0;
  await Promise.all(
    devices.map(async (d) => {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, body, { TTL: 24 * 3600, urgency: 'high' });
        delivered++;
        await prisma.pushDevice.update({ where: { id: d.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await prisma.pushDevice.delete({ where: { id: d.id } }).catch(() => {});
        else console.error('[push] 보내기 실패', { tenantId, status });
      }
    }),
  );
  return delivered;
}

/** 더클 운영자 기기 모두에게 보낸다 (새 학원 개설·회원가입 등). 보낸 기기 수를 돌려준다 */
export async function pushToOperators(payload: PushPayload, opts: { email?: string } = {}): Promise<number> {
  if (!pushConfigured()) return 0;
  const devices = await prisma.operatorPushDevice.findMany({ where: opts.email ? { email: opts.email } : {} });
  if (devices.length === 0) return 0;
  const body = JSON.stringify({ ...payload, title: payload.title.slice(0, 80), body: payload.body.slice(0, 300) });
  let delivered = 0;
  await Promise.all(
    devices.map(async (d) => {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, body, { TTL: 24 * 3600, urgency: 'normal' });
        delivered++;
        await prisma.operatorPushDevice.update({ where: { id: d.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await prisma.operatorPushDevice.delete({ where: { id: d.id } }).catch(() => {});
        else console.error('[push] 운영자 알림 실패', { status });
      }
    }),
  );
  return delivered;
}

/** 이메일 가리기 — 알림 내용용 (redshine0419@gmail.com → red***@gmail.com) */
export function maskEmail(email: string): string {
  const [id, domain] = email.split('@');
  if (!domain) return '***';
  return `${id.slice(0, 3)}***@${domain}`;
}

/**
 * 원장·직원 알림 — 푸시를 먼저 보내고, 학원 설정(pushReplacesKakao)이 켜져 있고 한 대라도 받았으면 알림톡을 건너뛴다.
 * 쓰는 쪽: `const p = await notifyStaff(...); if (!p.skipKakao) { 기존 알림톡 발송 }`
 */
export async function notifyStaff(tenantId: string, payload: PushPayload): Promise<{ pushed: number; skipKakao: boolean }> {
  const pushed = await pushToTenant(tenantId, payload).catch(() => 0);
  if (pushed === 0) return { pushed, skipKakao: false };
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { pushReplacesKakao: true } });
  return { pushed, skipKakao: !!t?.pushReplacesKakao };
}

/** 브라우저 정보로 기기 이름 짐작 (설정 화면 표시용) */
export function deviceLabel(ua: string): string {
  const os = /iPhone|iPad/.test(ua) ? (/iPad/.test(ua) ? 'iPad' : 'iPhone') : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : '기기';
  const br = /SamsungBrowser/.test(ua) ? '삼성 인터넷' : /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : '';
  return [os, br].filter(Boolean).join(' · ');
}
