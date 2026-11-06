import { describe, expect, it } from 'vitest';
import { daysSince, paymentDeleteAfter } from '../retention';

describe('retention', () => {
  it('비공개 경과 일수', () => {
    const at = new Date('2026-11-01T00:00:00Z');
    expect(daysSince(at, new Date('2026-11-01T10:00:00Z'))).toBe(0);
    expect(daysSince(at, new Date('2026-11-31T01:00:00Z'))).toBe(30);
  });
  it('결제 기록은 5년 보관', () => {
    expect(paymentDeleteAfter(new Date('2026-11-07T03:00:00Z')).toISOString()).toBe('2031-11-07T03:00:00.000Z');
  });
});
