import { describe, expect, it } from 'vitest';
import { buildReportSnapshot, isReportToken, newReportToken, parseReportInput, reportStatus } from '../report';

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe('parseReportInput', () => {
  const base = { periodStart: '2026-10-01', periodEnd: '2026-10-25', comment: '열심히 했습니다' };
  it('정상 입력, 포함 항목 기본값은 켜짐', () => {
    const r = parseReportInput(base, '2026-10-26');
    expect(r.ok && r.data).toMatchObject({ includeScores: true, includeAttendance: true, comment: '열심히 했습니다' });
  });
  it('코멘트 없음·기간 역전·미래·1년 초과를 거절한다', () => {
    expect(parseReportInput({ ...base, comment: ' ' }, '2026-10-26').ok).toBe(false);
    expect(parseReportInput({ ...base, periodStart: '2026-10-30' }, '2026-10-31').ok).toBe(false);
    expect(parseReportInput({ ...base, periodEnd: '2026-10-27' }, '2026-10-26').ok).toBe(false);
    expect(parseReportInput({ ...base, periodStart: '2025-01-01' }, '2026-10-26').ok).toBe(false);
  });
});

describe('buildReportSnapshot', () => {
  const academy = { name: '하늘수학', slug: 'hanul', phone: '02-000-0000', kakaoChannelUrl: null };
  const student = { name: '김도윤', grade: '중2', className: '심화반' };
  const scores = [
    { examDate: d('2026-09-30'), kind: 'school' as const, label: '밖', subject: '수학', score: 50, maxScore: 100, rankGrade: null },
    { examDate: d('2026-10-20'), kind: 'school' as const, label: '중간', subject: '수학', score: 88, maxScore: 100, rankGrade: 2 },
    { examDate: d('2026-10-05'), kind: 'academy' as const, label: '단원', subject: '수학', score: 70, maxScore: 100, rankGrade: null },
  ];
  const attendances = [
    { date: d('2026-10-02'), status: 'present' as const },
    { date: d('2026-10-04'), status: 'late' as const },
    { date: d('2026-10-06'), status: 'absent' as const },
    { date: d('2026-09-28'), status: 'absent' as const },
  ];
  const input = { start: d('2026-10-01'), end: d('2026-10-25'), comment: 'c', includeScores: true, includeAttendance: true };

  it('기간 안의 성적·출결만 담고 날짜순으로 정렬한다', () => {
    const s = buildReportSnapshot({ academy, student, input, scores, attendances });
    expect(s.scores?.map((x) => x.label)).toEqual(['단원', '중간']);
    expect(s.attendance).toEqual({ total: 3, counts: { present: 1, late: 1, absent: 1, excused: 0 }, rate: 67 });
  });
  it('끈 항목은 null이고, 내부 기록 필드는 아예 없다', () => {
    const s = buildReportSnapshot({ academy, student, input: { ...input, includeScores: false, includeAttendance: false }, scores, attendances });
    expect(s.scores).toBeNull();
    expect(s.attendance).toBeNull();
    const json = JSON.stringify(s);
    for (const k of ['traits', 'summary', 'notes', 'parentPhone', 'memo']) expect(json).not.toContain(k);
  });
});

describe('token / status', () => {
  it('토큰은 32자 base64url', () => {
    const t = newReportToken();
    expect(isReportToken(t)).toBe(true);
    expect(isReportToken('short')).toBe(false);
    expect(newReportToken()).not.toBe(t);
  });
  it('만료·중지', () => {
    const now = new Date('2026-10-26T00:00:00Z');
    expect(reportStatus({ expiresAt: '2026-11-01T00:00:00Z', revokedAt: null }, now)).toBe('active');
    expect(reportStatus({ expiresAt: '2026-10-25T00:00:00Z', revokedAt: null }, now)).toBe('expired');
    expect(reportStatus({ expiresAt: '2026-11-01T00:00:00Z', revokedAt: '2026-10-25T00:00:00Z' }, now)).toBe('revoked');
  });
});
