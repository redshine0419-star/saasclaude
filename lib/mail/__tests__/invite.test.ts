import { describe, expect, it } from 'vitest';
import { renderInviteMail } from '../invite';

describe('renderInviteMail', () => {
  it('학원명 이스케이프, 링크·유효기간(KST) 포함', () => {
    const m = renderInviteMail({ academyName: '<하늘>수학', inviteUrl: 'https://growweb.me/auth/accept-invite?token=abc', expiresAt: new Date('2026-11-02T20:00:00Z') });
    expect(m.subject).toBe('[첫등원] <하늘>수학 관리자 초대');
    expect(m.html).toContain('&lt;하늘&gt;수학');
    expect(m.html).not.toContain('<하늘>');
    expect(m.text).toContain('https://growweb.me/auth/accept-invite?token=abc');
    expect(m.text).toContain('2026.11.03까지');
  });
});
