/** 보낼 문자 — 화면(클라이언트)에서도 쓰는 값. DB를 쓰지 않는다 */
/** 문구를 학원이 고칠 수 있는 종류 (상담 학부모에게) */
export type TemplatedSmsKind = 'receipt' | 'reminder' | 'followup';
/** test_link: 재원생에게 보내는 시험 링크 (학생 번호로) */
export type SmsKind = TemplatedSmsKind | 'test_link';
export const SMS_KIND_LABEL: Record<SmsKind, string> = { receipt: '접수 확인', reminder: '레벨테스트 전날 안내', followup: '상담 후 안내', test_link: '시험 링크' };
export const isSmsKind = (k: unknown): k is SmsKind => k === 'receipt' || k === 'reminder' || k === 'followup' || k === 'test_link';
export const isTemplatedSmsKind = (k: unknown): k is TemplatedSmsKind => k === 'receipt' || k === 'reminder' || k === 'followup';
export const SMS_VARS = ['#{학원명}', '#{학부모명}', '#{학생학년}', '#{테스트일시}'] as const;

/** 학생 시험 링크 문자 (학원이 고치지 않는 고정 문구) */
export function testLinkSms(academy: string, student: string, testTitle: string, url: string): string {
  return `[${academy}] ${student} 학생, "${testTitle}" 시험 링크입니다. 휴대폰으로 열어 풀어 주세요. 제출하면 바로 채점됩니다.\n${url}`;
}
