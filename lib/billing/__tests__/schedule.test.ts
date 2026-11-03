import { describe, expect, it } from 'vitest';
import { addMonth, firstBillingAt, retryAt } from '../schedule';

const d = (s: string) => new Date(s);

describe('billing schedule', () => {
  it('한 달 뒤, 말일은 다음 달 말일로', () => {
    expect(addMonth(d('2026-01-15T01:00:00Z')).toISOString()).toBe('2026-02-15T01:00:00.000Z');
    expect(addMonth(d('2026-01-31T01:00:00Z')).toISOString()).toBe('2026-02-28T01:00:00.000Z');
    expect(addMonth(d('2026-12-10T00:00:00Z')).toISOString()).toBe('2027-01-10T00:00:00.000Z');
  });
  it('첫 결제일: 베타 중이면 베타 종료일, 아니면 지금', () => {
    const now = d('2026-11-03T00:00:00Z');
    expect(firstBillingAt(now, 'beta', d('2027-01-10T00:00:00Z')).toISOString()).toBe('2027-01-10T00:00:00.000Z');
    expect(firstBillingAt(now, 'beta', d('2026-10-01T00:00:00Z'))).toBe(now);
    expect(firstBillingAt(now, 'paid', null)).toBe(now);
  });
  it('실패 재시도는 3번까지 다음 날', () => {
    const now = d('2026-11-03T00:00:00Z');
    expect(retryAt(now, 1)?.toISOString()).toBe('2026-11-04T00:00:00.000Z');
    expect(retryAt(now, 3)).toBeNull();
  });
});
