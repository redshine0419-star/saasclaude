import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendMail } from '../send';

const input = { to: ['op@example.com'], subject: '제목', html: '<p>본문</p>', text: '본문' };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('sendMail', () => {
  it('키가 없으면 목으로 처리하고 요청하지 않는다', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendMail(input)).toEqual({ sent: false, reason: 'mock' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Resend API 형식으로 보낸다', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('MAIL_FROM', '');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"x"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await sendMail(input)).toEqual({ sent: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    expect(JSON.parse(init.body)).toMatchObject({ from: '첫등원 <onboarding@resend.dev>', to: ['op@example.com'], subject: '제목' });
  });

  it('실패 시 Resend 오류 문구를 돌려준다', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"message":"API key is invalid"}', { status: 401 })));
    expect(await sendMail(input)).toEqual({ sent: false, reason: 'http 401 — API key is invalid' });
  });
});
