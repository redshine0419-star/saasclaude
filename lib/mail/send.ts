/**
 * 메일 발송 어댑터. RESEND_API_KEY가 있으면 Resend HTTP API로, 없으면 목(mock)으로 기록만 한다.
 * 다른 서비스로 바꿀 때는 이 파일만 고친다. 로그에는 받는 주소·본문을 남기지 않는다.
 */
export type MailInput = { to: string[]; subject: string; html: string; text: string };
export type MailResult = { sent: boolean; reason?: string };

const RESEND_URL = 'https://api.resend.com/emails';

export async function sendMail(input: MailInput): Promise<MailResult> {
  if (input.to.length === 0) return { sent: false, reason: 'no recipient' };

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('[mail:mock]', { subject: input.subject, recipients: input.to.length });
    return { sent: false, reason: 'mock' };
  }

  // 도메인 인증 전에는 Resend 기본 발신 주소만 쓸 수 있다
  const from = process.env.MAIL_FROM || '첫등원 <onboarding@resend.dev>';
  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html, text: input.text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[mail] resend failed:', res.status);
      return { sent: false, reason: `http ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error('[mail] resend error:', e instanceof Error ? e.name : 'unknown');
    return { sent: false, reason: 'network' };
  }
}
