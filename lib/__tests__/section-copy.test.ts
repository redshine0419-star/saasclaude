import { describe, expect, it } from 'vitest';
import { parseSectionCopy, readSectionCopy, sectionItems, sectionTitle, SECTION_COPY_SPEC } from '../section-copy';

describe('sectionTitle / sectionItems', () => {
  it('비어 있으면 기본 제목·기본 항목', () => {
    expect(sectionTitle({}, 'fees')).toBe(SECTION_COPY_SPEC.fees.title);
    expect(sectionTitle({ fees: { title: '교습비 안내' } }, 'fees')).toBe('교습비 안내');
    expect(sectionItems({}, 'day_flow').length).toBe(5);
  });
  it('안심 항목은 기본값을 공개하지 않는다', () => {
    expect(sectionItems({}, 'safety')).toEqual([]);
    expect(sectionItems({ safety: { items: [{ title: '셔틀', body: '동승' }] } }, 'safety')).toEqual([{ title: '셔틀', body: '동승' }]);
  });
  it('기본 문구에 시스템에 없는 등·하원 알림 주장이 없다', () => {
    const all = JSON.stringify(SECTION_COPY_SPEC.day_flow);
    expect(all).not.toMatch(/알림/);
  });
});

describe('parseSectionCopy', () => {
  it('정상 저장, 빈 항목 줄은 무시', () => {
    const r = parseSectionCopy({ fees: { title: ' 교습비\n안내 ' }, exam_system: { items: [{ code: 'D-30', title: '범위', body: '정리' }, { code: '', title: '', body: '' }] } });
    expect(r.ok && r.data).toEqual({ fees: { title: '교습비\n안내' }, exam_system: { items: [{ code: 'D-30', title: '범위', body: '정리' }] } });
  });
  it('모르는 섹션·긴 제목·3줄·항목 초과·항목 없는 섹션을 거절', () => {
    expect(parseSectionCopy({ nope: { title: 'x' } }).ok).toBe(false);
    expect(parseSectionCopy({ fees: { title: 'a'.repeat(31) } }).ok).toBe(false);
    expect(parseSectionCopy({ fees: { title: 'a\nb\nc' } }).ok).toBe(false);
    expect(parseSectionCopy({ fees: { items: [{ title: 'x', body: 'y' }] } }).ok).toBe(false);
    expect(parseSectionCopy({ safety: { items: Array.from({ length: 7 }, (_, i) => ({ title: `t${i}`, body: '' })) } }).ok).toBe(false);
    expect(parseSectionCopy({ safety: { items: [{ title: '', body: '내용만' }] } }).ok).toBe(false);
  });
  it('DB 값 읽기: 모르는 키·형식은 버린다', () => {
    expect(readSectionCopy({ fees: { title: 'x' }, junk: { title: 'y' }, safety: { items: [{ title: 'a' }, 3] } })).toEqual({ fees: { title: 'x' }, safety: { items: [{ title: 'a', body: '' }] } });
    expect(readSectionCopy(null)).toEqual({});
  });
});
