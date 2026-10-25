import { describe, expect, it } from 'vitest';
import { parseAttendance, parseDateOnly, parseNote, parseScore, parseStudent } from '../input';
import { maskPhone } from '../labels';

describe('parseStudent', () => {
  it('이름은 필수, 나머지는 빈 값이면 null', () => {
    expect(parseStudent({ name: ' ' }, false)).toEqual({ ok: false, error: '학생 이름을 입력해 주세요.' });
    const r = parseStudent({ name: '홍길동', grade: '', parentPhone: '010-1234-5678' }, false);
    expect(r.ok && r.data).toMatchObject({ name: '홍길동', grade: null, parentPhone: '010-1234-5678' });
  });
  it('PATCH는 들어온 칸만 반영한다', () => {
    const r = parseStudent({ summary: '집중력 좋음' }, true);
    expect(r.ok && r.data).toEqual({ summary: '집중력 좋음' });
  });
  it('잘못된 전화·상태·태그 개수를 거절한다', () => {
    expect(parseStudent({ name: 'a', parentPhone: '전화' }, false).ok).toBe(false);
    expect(parseStudent({ status: 'gone' }, true).ok).toBe(false);
    expect(parseStudent({ traits: Array.from({ length: 13 }, (_, i) => `t${i}`) }, true).ok).toBe(false);
  });
  it('태그 중복을 없앤다', () => {
    const r = parseStudent({ traits: ['꼼꼼함', ' 꼼꼼함 ', ''] }, true);
    expect(r.ok && r.data.traits).toEqual(['꼼꼼함']);
  });
});

describe('parseDateOnly', () => {
  it('YYYY-MM-DD만 받는다', () => {
    expect(parseDateOnly('2026-10-25')?.toISOString()).toBe('2026-10-25T00:00:00.000Z');
    expect(parseDateOnly('2026-02-30')).toBeNull();
    expect(parseDateOnly('25/10/2026')).toBeNull();
  });
});

describe('parseScore', () => {
  const base = { kind: 'school', examDate: '2026-10-20', label: '2학기 중간고사', subject: '수학', score: '88', maxScore: '100' };
  it('정상 입력', () => {
    const r = parseScore(base);
    expect(r.ok && r.data).toMatchObject({ score: 88, maxScore: 100, rankGrade: null });
  });
  it('범위 밖 점수·등급·백분위를 거절한다', () => {
    expect(parseScore({ ...base, score: '120' }).ok).toBe(false);
    expect(parseScore({ ...base, score: 'abc' }).ok).toBe(false);
    expect(parseScore({ ...base, rankGrade: '10' }).ok).toBe(false);
    expect(parseScore({ ...base, rankGrade: '2.5' }).ok).toBe(false);
    expect(parseScore({ ...base, percentile: '101' }).ok).toBe(false);
    expect(parseScore({ ...base, kind: 'quiz' }).ok).toBe(false);
  });
});

describe('parseNote / parseAttendance', () => {
  it('빈 메모 거절, 모르는 종류는 기타', () => {
    expect(parseNote({ body: '' }).ok).toBe(false);
    const r = parseNote({ body: '집중 잘함', kind: 'x' });
    expect(r.ok && r.data.kind).toBe('other');
  });
  it('출결: null은 지우기, 모르는 값은 거절', () => {
    const r = parseAttendance({ date: '2026-10-25', entries: [{ studentId: 's1', status: 'present' }, { studentId: 's2', status: null }] });
    expect(r.ok && r.data.entries.map((e) => e.status)).toEqual(['present', null]);
    expect(parseAttendance({ date: '2026-10-25', entries: [{ studentId: 's1', status: 'sick' }] }).ok).toBe(false);
    expect(parseAttendance({ date: 'x', entries: [] }).ok).toBe(false);
  });
});

describe('maskPhone', () => {
  it('목록용 마스킹', () => {
    expect(maskPhone('010-1234-5678')).toBe('010-****-5678');
    expect(maskPhone(null)).toBe('');
  });
});
