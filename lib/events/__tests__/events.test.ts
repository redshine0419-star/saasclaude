import { describe, it, expect } from 'vitest';
import { addMonths, canSubmit, parseClaimInput, planExtension, resetBetaNotices, FEEDBACK_MIN } from '../index';

const now = new Date('2026-11-17T00:00:00Z');

describe('이벤트 신청 검사', () => {
  it('개선 제안은 30자 이상', () => {
    expect(parseClaimInput({ kind: 'feedback', content: '짧음' }).ok).toBe(false);
    const r = parseClaimInput({ kind: 'feedback', content: '가'.repeat(FEEDBACK_MIN) });
    expect(r.ok).toBe(true);
  });
  it('블로그는 주소·공개·대가 표시·개인정보 확인이 모두 있어야 한다', () => {
    const base = { kind: 'blog', url: 'https://blog.naver.com/abc/123', ownPublic: true, disclosure: true, noPersonal: true };
    expect(parseClaimInput(base).ok).toBe(true);
    const noDisc = parseClaimInput({ ...base, disclosure: false });
    expect(noDisc.ok).toBe(false);
    if (!noDisc.ok) expect(noDisc.error).toContain('혜택');
    expect(parseClaimInput({ ...base, ownPublic: false }).ok).toBe(false);
    expect(parseClaimInput({ ...base, noPersonal: undefined }).ok).toBe(false);
    expect(parseClaimInput({ ...base, url: 'blog.naver.com' }).ok).toBe(false);
    expect(parseClaimInput({ ...base, url: 'javascript:alert(1)' }).ok).toBe(false);
    expect(parseClaimInput({ ...base, url: 'https://growweb.me/hanul' }).ok).toBe(false);
  });
  it('모르는 종류는 거절', () => {
    expect(parseClaimInput({ kind: 'review' }).ok).toBe(false);
    expect(parseClaimInput(null).ok).toBe(false);
  });
});

describe('한 번만', () => {
  it('승인됐거나 확인 중이면 다시 낼 수 없고, 반려만 있으면 낼 수 있다', () => {
    expect(canSubmit([{ kind: 'blog', status: 'approved' }], 'blog').ok).toBe(false);
    expect(canSubmit([{ kind: 'blog', status: 'pending' }], 'blog').ok).toBe(false);
    expect(canSubmit([{ kind: 'blog', status: 'rejected' }], 'blog').ok).toBe(true);
    expect(canSubmit([{ kind: 'blog', status: 'approved' }], 'feedback').ok).toBe(true);
  });
});

describe('기간 늘리기', () => {
  it('개월 더하기는 말일을 맞춘다', () => {
    expect(addMonths(new Date('2026-01-31T15:00:00Z'), 1).toISOString()).toBe('2026-02-28T15:00:00.000Z');
    expect(addMonths(new Date('2026-11-17T00:00:00Z'), 3).toISOString()).toBe('2027-02-17T00:00:00.000Z');
  });
  it('무료 기간 중이면 종료일 뒤에 붙인다', () => {
    const p = planExtension({ planStatus: 'beta', betaEndsAt: new Date('2027-01-10T00:00:00Z') }, null, 1, now);
    expect(p.target).toBe('beta');
    expect(p.until.toISOString()).toBe('2027-02-10T00:00:00.000Z');
  });
  it('무료 기간이 끝났으면 오늘부터', () => {
    const p = planExtension({ planStatus: 'beta', betaEndsAt: new Date('2026-10-01T00:00:00Z') }, null, 3, now);
    expect(p.until.toISOString()).toBe('2027-02-17T00:00:00.000Z');
  });
  it('유료 결제 중이면 다음 결제일을 늦춘다', () => {
    const p = planExtension({ planStatus: 'paid', betaEndsAt: null }, { status: 'active', nextBillingAt: new Date('2026-12-05T00:00:00Z') }, 1, now);
    expect(p.target).toBe('subscription');
    expect(p.until.toISOString()).toBe('2027-01-05T00:00:00.000Z');
  });
  it('해지한 구독이면 무료 기간으로', () => {
    const p = planExtension({ planStatus: 'paid', betaEndsAt: null }, { status: 'canceled', nextBillingAt: new Date('2026-12-05T00:00:00Z') }, 1, now);
    expect(p.target).toBe('beta');
  });
  it('종료 안내 기록만 지운다', () => {
    expect(resetBetaNotices({ d14: 'x', d3: 'y', continueRequestedAt: 'z' })).toEqual({ continueRequestedAt: 'z' });
  });
});
