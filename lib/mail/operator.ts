import { sendMail } from './send';

/** 운영자 알림 메일 — 무료 진단·제작 대행 신청·셀프 개설 접수 시 OPERATOR_NOTIFY_EMAIL로 보낸다 */

/** 따옴표·"이름 <메일>"·세미콜론·공백 구분도 받아 준다 */
export function parseRecipients(raw: string | undefined): string[] {
  const found = (raw ?? '').match(/[^\s<>"',;]+@[^\s<>"',;]+\.[^\s<>"',;]+/g) ?? [];
  return [...new Set(found.map((e) => e.toLowerCase()))];
}

export function operatorRecipients(): string[] {
  return parseRecipients(process.env.OPERATOR_NOTIFY_EMAIL);
}

/** 메일에는 연락처 원문을 넣지 않는다 — 전체 번호는 플랫폼 관리자 상세에서 확인 */
export function maskPhoneForMail(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  return d.length >= 4 ? `****-${d.slice(-4)}` : '****';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export type OperatorMail = {
  subject: string;
  heading: string;
  rows: [string, string][];
  /** 플랫폼 관리자 경로 (예: /platform/diagnosis) */
  linkPath: string;
  linkLabel: string;
};

export function renderOperatorMail(m: OperatorMail, baseUrl: string) {
  const link = `${baseUrl.replace(/\/$/, '')}${m.linkPath}`;
  const text = [m.heading, '', ...m.rows.map(([k, v]) => `${k}: ${v}`), '', `${m.linkLabel}: ${link}`].join('\n');
  const html =
    `<div style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1B2430;max-width:560px">` +
    `<h2 style="font-size:18px;margin:0 0 16px">${esc(m.heading)}</h2>` +
    `<table style="border-collapse:collapse;width:100%;font-size:14px">` +
    m.rows
      .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#5A6270;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`)
      .join('') +
    `</table>` +
    `<p style="margin:20px 0 0"><a href="${esc(link)}" style="display:inline-block;padding:10px 16px;background:#1B2430;color:#FFFFFF;border-radius:8px;text-decoration:none;font-weight:600">${esc(m.linkLabel)}</a></p>` +
    `</div>`;
  return { text, html };
}

/** 실패해도 신청 처리를 막지 않는다 */
export async function notifyOperator(m: OperatorMail): Promise<void> {
  const to = operatorRecipients();
  if (to.length === 0) return;
  const { text, html } = renderOperatorMail(m, process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me');
  await sendMail({ to, subject: m.subject, html, text }).catch(() => undefined);
}
