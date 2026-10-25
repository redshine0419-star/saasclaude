import { randomBytes } from 'node:crypto';
import type { AttendanceStatus, ScoreKind } from '@prisma/client';
import { parseDateOnly } from './input';

/**
 * 학부모 공유 리포트 (SPEC 14장).
 * 발행 시점의 성적·출결을 스냅샷으로 고정한다 — 학생부를 나중에 고쳐도 보낸 리포트는 바뀌지 않고,
 * 관찰 메모·성격 태그·연락처 같은 내부 기록은 처음부터 담지 않는다.
 */

export const REPORT_TTL_DAYS = 30;
export const MAX_REPORT_COMMENT = 1500;
const MAX_PERIOD_DAYS = 366;

export type ReportScore = { examDate: string; kind: ScoreKind; label: string; subject: string; score: number; maxScore: number; rankGrade: number | null };
export type ReportSnapshot = {
  v: 1;
  academy: { name: string; phone: string | null; kakaoChannelUrl: string | null; slug: string };
  student: { name: string; grade: string | null; className: string | null };
  period: { start: string; end: string };
  scores: ReportScore[] | null; // null = 리포트에서 뺌
  attendance: { total: number; counts: Record<AttendanceStatus, number>; rate: number | null } | null;
  comment: string;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type ReportInput = { start: Date; end: Date; comment: string; includeScores: boolean; includeAttendance: boolean };

export function parseReportInput(body: Record<string, unknown>, today: string): Result<ReportInput> {
  const start = parseDateOnly(body.periodStart);
  const end = parseDateOnly(body.periodEnd);
  if (!start || !end) return { ok: false, error: '기간을 확인해 주세요.' };
  if (start > end) return { ok: false, error: '시작일이 종료일보다 늦습니다.' };
  if (end.toISOString().slice(0, 10) > today) return { ok: false, error: '종료일은 오늘까지 고를 수 있습니다.' };
  if ((end.getTime() - start.getTime()) / 86400000 > MAX_PERIOD_DAYS) return { ok: false, error: '기간은 1년까지 고를 수 있습니다.' };
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, MAX_REPORT_COMMENT) : '';
  if (!comment) return { ok: false, error: '학부모님께 드릴 선생님 코멘트를 써 주세요.' };
  const includeScores = body.includeScores !== false;
  const includeAttendance = body.includeAttendance !== false;
  return { ok: true, data: { start, end, comment, includeScores, includeAttendance } };
}

type BuildArgs = {
  academy: ReportSnapshot['academy'];
  student: ReportSnapshot['student'];
  input: ReportInput;
  /** 기간 안팎 상관없이 넘겨도 된다 — 여기서 기간으로 거른다 */
  scores: { examDate: Date; kind: ScoreKind; label: string; subject: string; score: number; maxScore: number; rankGrade: number | null }[];
  attendances: { date: Date; status: AttendanceStatus }[];
};

export function buildReportSnapshot({ academy, student, input, scores, attendances }: BuildArgs): ReportSnapshot {
  const inPeriod = (d: Date) => d >= input.start && d <= input.end;
  const att = attendances.filter((a) => inPeriod(a.date));
  const counts: Record<AttendanceStatus, number> = { present: 0, late: 0, absent: 0, excused: 0 };
  for (const a of att) counts[a.status]++;
  return {
    v: 1,
    academy,
    student,
    period: { start: input.start.toISOString().slice(0, 10), end: input.end.toISOString().slice(0, 10) },
    scores: input.includeScores
      ? scores
          .filter((s) => inPeriod(s.examDate))
          .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
          .map((s) => ({ examDate: s.examDate.toISOString().slice(0, 10), kind: s.kind, label: s.label, subject: s.subject, score: s.score, maxScore: s.maxScore, rankGrade: s.rankGrade }))
      : null,
    attendance: input.includeAttendance
      ? { total: att.length, counts, rate: att.length ? Math.round(((counts.present + counts.late) / att.length) * 100) : null }
      : null,
    comment: input.comment,
  };
}

export function newReportToken(): string {
  return randomBytes(24).toString('base64url');
}

export function isReportToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(token);
}

export function reportStatus(r: { expiresAt: Date | string; revokedAt: Date | string | null }, now: Date = new Date()): 'active' | 'expired' | 'revoked' {
  if (r.revokedAt) return 'revoked';
  return new Date(r.expiresAt) <= now ? 'expired' : 'active';
}
