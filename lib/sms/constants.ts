/** 보낼 문자 — 화면(클라이언트)에서도 쓰는 값. DB를 쓰지 않는다 */
export type SmsKind = 'receipt' | 'reminder' | 'followup';
export const SMS_KIND_LABEL: Record<SmsKind, string> = { receipt: '접수 확인', reminder: '레벨테스트 전날 안내', followup: '상담 후 안내' };
export const isSmsKind = (k: unknown): k is SmsKind => k === 'receipt' || k === 'reminder' || k === 'followup';
export const SMS_VARS = ['#{학원명}', '#{학부모명}', '#{학생학년}', '#{테스트일시}'] as const;
