import { describe, expect, it } from 'vitest';
import { isTestPhone } from '../test-phone';

describe('isTestPhone', () => {
  it('010-0000-xxxx만 샘플 번호로 본다', () => {
    expect(isTestPhone('010-0000-1001')).toBe(true);
    expect(isTestPhone('01000001001')).toBe(true);
    expect(isTestPhone('010-1234-5678')).toBe(false);
    expect(isTestPhone('010-0001-0000')).toBe(false);
    expect(isTestPhone(null)).toBe(false);
  });
});
