import type { AttendanceStatus, ScoreKind, StudentNoteKind, StudentStatus } from '@prisma/client';

export const STATUS_LABEL: Record<StudentStatus, string> = { active: '재원', paused: '휴원', left: '퇴원' };

export const CONSENT_METHOD_LABEL = {
  written: '입학 원서 서면 동의',
  electronic: '전자 동의 (온라인·문자 회신)',
  other: '기타',
} as const;
export type ConsentMethod = keyof typeof CONSENT_METHOD_LABEL;

/**
 * 메모·출결 사유에 건강 정보(민감정보)를 적지 않도록 화면에서 경고하는 단어.
 * 막지는 않는다 — 판단은 선생님이 한다.
 */
const HEALTH_WORDS = [
  'adhd', '자폐', '우울', '불안장애', '공황', '틱', '난독', '발달장애', '지적장애', '장애', '진단', '복용',
  '정신과', '상담치료', '치료 중', '병원', '입원', '수술', '병명', '질환', '감기', '독감', '코로나', '장염', '천식', '알레르기', '아토피',
];
export function findHealthWords(text: string): string[] {
  const t = text.toLowerCase();
  return HEALTH_WORDS.filter((w) => t.includes(w));
}

/** 학원이 입학 원서에 넣을 수 있는 동의 문구 예시 — 법률 검토 전 예시일 뿐이다 */
export const CONSENT_TEMPLATE = `[개인정보 수집·이용 동의 (학생 학습 관리)]

1. 수집 항목: 학생 이름·학년·학교·연락처, 학부모 이름·연락처, 성적(내신·모의고사·학원 테스트), 출결, 수업 중 학습 태도·특성에 대한 선생님 관찰 기록
2. 이용 목적: 수업 운영, 학습 지도·상담, 학부모 상담
3. 보유 기간: 퇴원 시 즉시 파기
4. 동의를 거부할 수 있으며, 거부하면 성적·관찰 기록 없이 수업만 진행합니다.
5. 학원은 건강·질병 등 민감정보를 기록하지 않습니다.

위 내용을 확인하고 동의합니다. (만 14세 미만 학생은 법정대리인이 동의합니다)

20  년   월   일   학생:          학부모(법정대리인):          (서명)`;

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
