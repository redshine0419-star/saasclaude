import { describe, expect, it } from 'vitest';
import { paymentDeleteAfter, purgeDueAt, TENANT_PURGE_DAYS } from '../retention';

describe('retention', () => {
  it('비공개 전환 30일 뒤가 파기일', () => {
    const at = new Date('2026-11-01T00:00:00Z');
    expect(purgeDueAt(at).toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(TENANT_PURGE_DAYS).toBe(30);
  });
  it('결제 기록은 5년 보관', () => {
    expect(paymentDeleteAfter(new Date('2026-11-07T03:00:00Z')).toISOString()).toBe('2031-11-07T03:00:00.000Z');
  });
});
