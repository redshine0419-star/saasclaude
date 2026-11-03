import { describe, expect, it } from 'vitest';
import { formatWon, tierFor, tierPrice } from '../plan-tier';

describe('plan tier', () => {
  it('재원생 수로 구간', () => {
    expect(tierFor(0).key).toBe('free');
    expect(tierFor(5).key).toBe('free');
    expect(tierFor(6).key).toBe('standard');
    expect(tierFor(50).key).toBe('standard');
    expect(tierFor(51).key).toBe('plus');
    expect(tierFor(500).key).toBe('plus');
  });
  it('금액: 무료 0원, 설정 없으면 기본값(3만·5만), 설정 있으면 그 값', () => {
    expect(tierPrice('free', {})).toBe(0);
    expect(tierPrice('standard', {})).toBe(30000);
    expect(tierPrice('plus', {})).toBe(50000);
    expect(tierPrice('standard', { price_tier_standard: '' })).toBe(30000);
    expect(tierPrice('standard', { price_tier_standard: '29000' })).toBe(29000);
    expect(formatWon(29000)).toBe('월 29,000원');
    expect(formatWon(null)).toBe('금액 미정');
  });
});
