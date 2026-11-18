import { describe, it, expect } from 'vitest';
import { refundLines, STATUTORY_REFUND_LINES } from '../refund';

describe('교습비 반환 기준 표시', () => {
  it('학원 규정이 없으면 법정 기준 (반환 기한 5일 포함)', () => {
    const r = refundLines(null);
    expect(r.isStatutory).toBe(true);
    expect(r.lines.some((l) => l.includes('5일 이내'))).toBe(true);
    expect(r.lines.some((l) => l.includes('2/3'))).toBe(true);
  });
  it('학원이 쓴 규정이 있으면 그 줄들', () => {
    const r = refundLines('첫째 줄\n\n 둘째 줄 ');
    expect(r).toEqual({ lines: ['첫째 줄', '둘째 줄'], isStatutory: false });
  });
  it('법정 기준 문구에 확인 필요 표시가 없다', () => {
    expect(STATUTORY_REFUND_LINES.join('')).not.toContain('확인 필요');
  });
});
