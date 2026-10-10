import { describe, expect, it } from 'vitest';
import { DEFAULT_SECTION_ORDER, normalizeSections } from '../sections';

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
      { key: 'director', enabled: true },
      { key: 'gallery', enabled: true },
      { key: 'gallery', enabled: false },
      { key: '<script>', enabled: true },
    ]);
    expect(out.some((s) => s.key === 'director' || s.key === '<script>')).toBe(false);
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
