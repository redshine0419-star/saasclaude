import { describe, expect, it } from 'vitest';
import { ACCENT_PRESETS, accentError, contrastWithWhite, MIN_CONTRAST } from '../accent';

describe('accent', () => {
  it('프리셋은 모두 대비 기준을 통과한다', () => {
    for (const p of ACCENT_PRESETS) expect(contrastWithWhite(p.hex)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });
  it('밝은 색과 잘못된 형식은 거부한다', () => {
    expect(accentError('#FFFF00')).not.toBeNull();
    expect(accentError('#FFF')).not.toBeNull();
    expect(accentError('red')).not.toBeNull();
  });
  it('빈 값(기본색)과 진한 색은 허용한다', () => {
    expect(accentError('')).toBeNull();
    expect(accentError('#000000')).toBeNull();
  });
});
