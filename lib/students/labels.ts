import type { AttendanceStatus, ScoreKind, StudentNoteKind, StudentStatus } from '@prisma/client';

export const STATUS_LABEL: Record<StudentStatus, string> = { active: '재원', paused: '휴원', left: '퇴원' };

export const NOTE_KIND_LABEL: Record<StudentNoteKind, string> = {
  attitude: '학습 태도',
  personality: '성격·특성',
  consult: '상담',
  parent: '학부모 소통',
  other: '기타',
};

export const SCORE_KIND_LABEL: Record<ScoreKind, string> = { school: '내신', mock: '모의고사', academy: '학원 테스트' };

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = { present: '출석', late: '지각', absent: '결석', excused: '사유 결석' };

/** 성격·특성 태그 추천 — 자유 입력도 된다 */
export const TRAIT_SUGGESTIONS = [
  '꼼꼼함', '덤벙댐', '질문 많음', '내성적', '활발함', '집중 짧음', '끈기 있음',
  '승부욕 강함', '칭찬에 반응', '숙제 성실', '숙제 미흡', '선행 필요', '기초 부족', '시험 불안',
];

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  return d.length >= 4 ? `****-${d.slice(-4)}` : '****';
}
