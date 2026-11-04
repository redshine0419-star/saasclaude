import { randomBytes } from 'node:crypto';

/**
 * 학부모용 학생 등록 링크 (/{slug}/join/{token}).
 * 학부모가 제출한 건은 StudentRegistration(등록 대기)으로 쌓이고, 원장·실장이 승인해야 학생부(Student)에 들어간다.
 * 승인하지 않은 건은 REGISTRATION_TTL_DAYS 뒤 지운다 — 목적(등록 검토)이 끝난 개인정보를 오래 두지 않는다.
 */

export const REGISTRATION_TTL_DAYS = 30;
/** 장난 제출로 대기 목록이 넘치지 않도록 학원당 대기 건 상한 */
export const MAX_PENDING = 200;
export const REGISTRATION_CONSENT_VERSION = '2026-11-05';

export function newRegToken(): string {
  return randomBytes(24).toString('base64url');
}

export function isRegToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32}$/.test(token);
}

/** 전자 동의 문구 — 학원 이름을 넣어 보여 준다. TODO(확인 필요): 법률 검토 전 문구 */
export function registrationConsentText(academyName: string) {
  return {
    title: '개인정보 수집·이용 동의 (필수)',
    items: [
      ['수집하는 곳', academyName],
      ['수집 항목', '학생 이름·학년·학교·연락처, 학부모 이름·연락처'],
      ['이용 목적', '원생 등록, 수업 운영, 학습 지도·상담, 학부모 연락. 등록 후에는 성적·출결·수업 중 관찰 기록을 학원이 관리합니다.'],
      ['보유 기간', '퇴원 시 즉시 파기. 학원이 등록을 승인하지 않으면 30일 안에 파기'],
      ['거부할 권리', '동의를 거부할 수 있으며, 이 경우 온라인 등록 대신 학원에 직접 문의해 주세요.'],
    ] as const,
    note: '건강·질병 등 민감정보는 적지 말아 주세요. 만 14세 미만 학생의 정보는 법정대리인(학부모)이 동의해야 합니다.',
  };
}

export type RegistrationFields = {
  studentName: string;
  grade: string | null;
  school: string | null;
  studentPhone: string | null;
  parentName: string;
  parentPhone: string;
  memo: string | null;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
const PHONE = /^[0-9+\-\s()]{9,20}$/;

/** 학부모 등록 폼 검사 — 순수 함수 */
export function parseRegistration(body: Record<string, unknown>): Result<RegistrationFields> {
  const studentName = str(body.studentName, 40);
  if (!studentName) return { ok: false, error: '학생 이름을 입력해 주세요.' };
  const parentName = str(body.parentName, 40);
  if (!parentName) return { ok: false, error: '학부모 이름을 입력해 주세요.' };
  const parentPhone = str(body.parentPhone, 20);
  if (!PHONE.test(parentPhone)) return { ok: false, error: '학부모 연락처를 확인해 주세요. (예: 010-1234-5678)' };
  const sp = str(body.studentPhone, 20);
  if (sp && !PHONE.test(sp)) return { ok: false, error: '학생 연락처 형식을 확인해 주세요.' };
  if (body.guardianConfirmed !== true) return { ok: false, error: '학부모(법정대리인)인지 확인해 주세요.' };
  if (body.consentAgreed !== true) return { ok: false, error: '개인정보 수집·이용에 동의해야 등록할 수 있습니다.' };
  return {
    ok: true,
    data: {
      studentName,
      grade: str(body.grade, 20) || null,
      school: str(body.school, 40) || null,
      studentPhone: sp || null,
      parentName,
      parentPhone,
      memo: str(body.memo, 300) || null,
    },
  };
}

export function registrationCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - REGISTRATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}
