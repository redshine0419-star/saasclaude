import { describe, expect, it } from 'vitest';
import { formatKstDate, formatKstDateTime } from '../format-date';

describe('format-date', () => {
  it('UTC 시각을 KST로 바꿔 고정 형식으로 쓴다', () => {
    expect(formatKstDateTime('2026-10-15T03:37:00Z')).toBe('2026.10.15 12:37');
    expect(formatKstDate(new Date('2026-10-15T16:00:00Z'))).toBe('2026.10.16'); // KST 다음날 01시
  });
});
