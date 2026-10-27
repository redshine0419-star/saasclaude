import { describe, expect, it } from 'vitest';
import { DEFAULT_ERROR_TYPES, errorSubjectOf, errorTypeLabel, errorTypesFor, parseErrorTypeConfig, readErrorTypeConfig } from '../error-types';

describe('error types', () => {
  it('문항 과목으로 기본 목록을 고른다', () => {
    expect(errorSubjectOf('수학')).toBe('수학');
    expect(errorSubjectOf('중등 영어')).toBe('영어');
    expect(errorSubjectOf('코딩')).toBe('기타');
    expect(errorTypesFor('영어', {})).toEqual(DEFAULT_ERROR_TYPES.영어);
  });
  it('학원이 고친 목록이 있으면 그 과목만 바뀐다', () => {
    const cfg = { 수학: ['부호 실수', '개념 오류'] };
    expect(errorTypesFor('수학', cfg)).toEqual(['부호 실수', '개념 오류']);
    expect(errorTypesFor('영어', cfg)).toEqual(DEFAULT_ERROR_TYPES.영어);
  });
  it('예전 영문 키를 한글로 읽는다', () => {
    expect(errorTypeLabel('calculation')).toBe('계산 실수');
    expect(errorTypeLabel('문법')).toBe('문법');
    expect(errorTypeLabel(null)).toBeNull();
  });
  it('저장 검사: 길이·개수·모르는 과목 거절, 기본값과 같거나 빈 목록은 저장 안 함', () => {
    expect(parseErrorTypeConfig({ 수학: ['a'.repeat(13)] }).ok).toBe(false);
    expect(parseErrorTypeConfig({ 수학: Array.from({ length: 11 }, (_, i) => `t${i}`) }).ok).toBe(false);
    expect(parseErrorTypeConfig({ 미술: ['x'] }).ok).toBe(false);
    const r = parseErrorTypeConfig({ 수학: [...DEFAULT_ERROR_TYPES.수학], 영어: [], 국어: [' 독해 ', '독해', '어휘'] });
    expect(r.ok && r.data).toEqual({ 국어: ['독해', '어휘'] });
  });
  it('DB 값 읽기', () => {
    expect(readErrorTypeConfig({ 수학: ['a', '', 'a'], 미술: ['x'] })).toEqual({ 수학: ['a'] });
    expect(readErrorTypeConfig(null)).toEqual({});
  });
});
