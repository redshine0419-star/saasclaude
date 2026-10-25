import type { AttendanceStatus, ScoreKind, StudentNoteKind, StudentStatus } from '@prisma/client';

/** 학생부 입력 검사 — 순수 함수(테스트 가능). 오류는 사용자에게 보여 줄 문구로 돌려준다. */

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// 퇴원(left)은 상태로 두지 않고 학생부를 파기한다 (DELETE)
const STATUSES: StudentStatus[] = ['active', 'paused'];
const CONSENT_METHODS = ['written', 'electronic', 'other'];
const NOTE_KINDS: StudentNoteKind[] = ['attitude', 'personality', 'consult', 'parent', 'other'];
const SCORE_KINDS: ScoreKind[] = ['school', 'mock', 'academy'];
const ATTENDANCE: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];

export const MAX_TRAITS = 12;
export const MAX_NOTE = 2000;

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
function opt(v: unknown, max: number): string | null {
  return str(v, max) || null;
}
function phone(v: unknown): string | null | 'invalid' {
  const s = str(v, 20);
  if (!s) return null;
  return /^[0-9+\-\s()]{9,20}$/.test(s) ? s : 'invalid';
}

/** YYYY-MM-DD → UTC 자정 Date (DB date 칼럼용) */
export function parseDateOnly(v: unknown): Date | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : d;
}

export type StudentFields = {
  name?: string;
  grade?: string | null;
  school?: string | null;
  classId?: string | null;
  status?: StudentStatus;
  enrolledAt?: Date;
  parentName?: string | null;
  parentPhone?: string | null;
  studentPhone?: string | null;
  traits?: string[];
  summary?: string | null;
  consentAt?: Date;
  consentMethod?: string;
};

/** partial=true면 들어온 칸만 검사·반영(PATCH) */
export function parseStudent(body: Record<string, unknown>, partial: boolean): Result<StudentFields> {
  const out: StudentFields = {};
  const has = (k: string) => !partial || k in body;

  if (has('name')) {
    const name = str(body.name, 40);
    if (!name) return { ok: false, error: '학생 이름을 입력해 주세요.' };
    out.name = name;
  }
  if (has('grade')) out.grade = opt(body.grade, 20);
  if (has('school')) out.school = opt(body.school, 40);
  if (has('classId')) out.classId = opt(body.classId, 40);
  if (has('parentName')) out.parentName = opt(body.parentName, 40);
  for (const k of ['parentPhone', 'studentPhone'] as const) {
    if (!has(k)) continue;
    const p = phone(body[k]);
    if (p === 'invalid') return { ok: false, error: '전화번호 형식을 확인해 주세요.' };
    out[k] = p;
  }
  if (has('summary')) out.summary = opt(body.summary, 300);
  if ('status' in body) {
    if (body.status === 'left') return { ok: false, error: '퇴원은 "퇴원 처리" 버튼으로 합니다. 퇴원하면 학생부가 즉시 삭제됩니다.' };
    if (!STATUSES.includes(body.status as StudentStatus)) return { ok: false, error: '상태 값이 올바르지 않습니다.' };
    out.status = body.status as StudentStatus;
  }
  if ('enrolledAt' in body && body.enrolledAt) {
    const d = parseDateOnly(body.enrolledAt);
    if (!d) return { ok: false, error: '등록일 형식을 확인해 주세요.' };
    out.enrolledAt = d;
  }
  // 학부모 동의: 등록 시 필수, 수정 시에는 보낸 경우만 (지울 수는 없다)
  if (!partial || 'consentAt' in body || 'consentMethod' in body) {
    if (body.consentConfirmed !== true) return { ok: false, error: '학부모 동의를 받았는지 확인해 주세요.' };
    const at = parseDateOnly(body.consentAt);
    if (!at || !CONSENT_METHODS.includes(body.consentMethod as string)) {
      return { ok: false, error: '학부모 개인정보 수집·이용 동의를 받은 날짜와 방식을 입력해 주세요.' };
    }
    out.consentAt = at;
    out.consentMethod = body.consentMethod as string;
  }
  if ('traits' in body) {
    if (!Array.isArray(body.traits)) return { ok: false, error: '태그 형식이 올바르지 않습니다.' };
    const tags = [...new Set(body.traits.map((t) => str(t, 20)).filter(Boolean))];
    if (tags.length > MAX_TRAITS) return { ok: false, error: `태그는 ${MAX_TRAITS}개까지 넣을 수 있습니다.` };
    out.traits = tags;
  }
  return { ok: true, data: out };
}

export function parseNote(body: Record<string, unknown>): Result<{ kind: StudentNoteKind; body: string }> {
  const text = str(body.body, MAX_NOTE);
  if (!text) return { ok: false, error: '메모 내용을 입력해 주세요.' };
  const kind = NOTE_KINDS.includes(body.kind as StudentNoteKind) ? (body.kind as StudentNoteKind) : 'other';
  return { ok: true, data: { kind, body: text } };
}

export type ScoreFields = {
  kind: ScoreKind;
  examDate: Date;
  label: string;
  subject: string;
  score: number;
  maxScore: number;
  rankGrade: number | null;
  percentile: number | null;
  memo: string | null;
};

function num(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function parseScore(body: Record<string, unknown>): Result<ScoreFields> {
  if (!SCORE_KINDS.includes(body.kind as ScoreKind)) return { ok: false, error: '성적 종류를 골라 주세요.' };
  const examDate = parseDateOnly(body.examDate);
  if (!examDate) return { ok: false, error: '시험 날짜를 입력해 주세요.' };
  const label = str(body.label, 40);
  if (!label) return { ok: false, error: '시험 이름을 입력해 주세요. (예: 2학기 중간고사)' };
  const subject = str(body.subject, 20);
  if (!subject) return { ok: false, error: '과목을 입력해 주세요.' };
  const score = num(body.score);
  const maxScore = num(body.maxScore) ?? 100;
  if (score === null || Number.isNaN(score) || Number.isNaN(maxScore) || maxScore <= 0) return { ok: false, error: '점수를 숫자로 입력해 주세요.' };
  if (score < 0 || score > maxScore) return { ok: false, error: '점수는 0점부터 만점 사이여야 합니다.' };
  const rankGrade = num(body.rankGrade);
  if (rankGrade !== null && (Number.isNaN(rankGrade) || !Number.isInteger(rankGrade) || rankGrade < 1 || rankGrade > 9)) {
    return { ok: false, error: '등급은 1~9 사이 정수로 입력해 주세요.' };
  }
  const percentile = num(body.percentile);
  if (percentile !== null && (Number.isNaN(percentile) || percentile < 0 || percentile > 100)) {
    return { ok: false, error: '백분위는 0~100 사이로 입력해 주세요.' };
  }
  return { ok: true, data: { kind: body.kind as ScoreKind, examDate, label, subject, score, maxScore, rankGrade, percentile, memo: opt(body.memo, 200) } };
}

export type AttendanceEntry = { studentId: string; status: AttendanceStatus | null; note: string | null };

/** status=null이면 그날 기록을 지운다 */
export function parseAttendance(body: Record<string, unknown>): Result<{ date: Date; entries: AttendanceEntry[] }> {
  const date = parseDateOnly(body.date);
  if (!date) return { ok: false, error: '날짜를 확인해 주세요.' };
  if (!Array.isArray(body.entries) || body.entries.length === 0) return { ok: false, error: '저장할 출결이 없습니다.' };
  if (body.entries.length > 300) return { ok: false, error: '한 번에 300명까지 저장할 수 있습니다.' };
  const entries: AttendanceEntry[] = [];
  for (const e of body.entries as Record<string, unknown>[]) {
    const studentId = str(e?.studentId, 40);
    if (!studentId) return { ok: false, error: '학생 정보가 올바르지 않습니다.' };
    const status = e.status === null ? null : ATTENDANCE.includes(e.status as AttendanceStatus) ? (e.status as AttendanceStatus) : undefined;
    if (status === undefined) return { ok: false, error: '출결 값이 올바르지 않습니다.' };
    entries.push({ studentId, status, note: opt(e.note, 100) });
  }
  return { ok: true, data: { date, entries } };
}
