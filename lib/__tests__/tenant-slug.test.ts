import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { slugError } = await import('../tenant');

describe('slugError', () => {
  it('정상 주소는 통과한다', () => {
    expect(slugError('hanul-math')).toBeNull();
    expect(slugError('abc')).toBeNull();
  });
  it('형식 오류를 막는다', () => {
    for (const s of ['ab', '-abc', 'abc-', 'ABC', 'han ul', 'a'.repeat(41), '한글']) {
      expect(slugError(s)).not.toBeNull();
    }
  });
  it('예약어와 데모 주소를 막는다', () => {
    for (const s of ['platform', 'start', 'admin', 'demo-warm', 'demo-anything']) {
      expect(slugError(s)).not.toBeNull();
    }
  });
});
