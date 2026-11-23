import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTION_ORDER, normalizeSections, themeSections, sectionEyebrow } from '../sections';

describe('normalizeSections', () => {
  it('잠금 섹션은 꺼서 보내도 켜진다', () => {
    const out = normalizeSections('warm', [
      { key: 'hero', enabled: false },
      { key: 'consult_form', enabled: false },
    ]);
    expect(out.find((s) => s.key === 'hero')?.enabled).toBe(true);
    expect(out.find((s) => s.key === 'consult_form')?.enabled).toBe(true);
  });

  it('hero는 항상 맨 앞으로 간다', () => {
    const out = normalizeSections('result', [
      { key: 'fees', enabled: true },
      { key: 'hero', enabled: true },
    ]);
    expect(out[0].key).toBe('hero');
    expect(out.map((s) => s.sortOrder)).toEqual(out.map((_, i) => i));
  });

  it('테마에 없는 섹션과 중복은 버린다', () => {
    const out = normalizeSections('bright', [
      { key: 'principles', enabled: true },
      { key: 'gallery', enabled: true },
      { key: 'gallery', enabled: false },
      { key: '<script>', enabled: true },
    ]);
    expect(out.some((s) => s.key === 'principles' || s.key === '<script>')).toBe(false);
    expect(out.filter((s) => s.key === 'gallery')).toHaveLength(1);
    expect(out.find((s) => s.key === 'gallery')?.enabled).toBe(true);
  });

  it('빠진 섹션은 꺼진 상태로 뒤에 붙는다 (잠금 섹션 제외)', () => {
    const out = normalizeSections('warm', [{ key: 'hero', enabled: true }]);
    expect(out).toHaveLength(DEFAULT_SECTION_ORDER.warm.length);
    expect(out.find((s) => s.key === 'faq')?.enabled).toBe(false);
    expect(out.find((s) => s.key === 'consult_form')?.enabled).toBe(true);
  });
});

describe('선택 섹션 — B·C 테마의 원장 소개', () => {
  it('기본으로는 꺼져 있다 (빠지면 꺼진 채로 뒤에 붙는다)', () => {
    for (const theme of ['result', 'bright'] as const) {
      const out = normalizeSections(theme, DEFAULT_SECTION_ORDER[theme].map((key) => ({ key, enabled: true })));
      expect(out.find((s) => s.key === 'director')?.enabled).toBe(false);
    }
  });
  it('원장이 켜면 켜진 채로 순서대로 저장된다', () => {
    const out = normalizeSections('bright', [{ key: 'hero', enabled: true }, { key: 'director', enabled: true }, { key: 'day_flow', enabled: true }]);
    expect(out[1]).toMatchObject({ key: 'director', enabled: true, sortOrder: 1 });
  });
  it('테마별로 쓸 수 있는 섹션과 라벨', () => {
    expect(themeSections('result')).toContain('director');
    expect(themeSections('warm').filter((k) => k === 'director')).toHaveLength(1);
    expect(sectionEyebrow('result', 'director')).toBe('DIRECTOR');
    expect(sectionEyebrow('bright', 'director')).toBe("DIRECTOR'S NOTE");
  });
});

