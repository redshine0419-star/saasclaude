import { prisma } from '@/lib/prisma';

/**
 * 학부모에게 보낼 문자 할 일 — 카카오톡 자동 발송 대신, 원장이 휴대폰 문자 앱으로 직접 보낸다.
 * receipt: 상담 접수 확인 (신청 즉시) · reminder: 레벨테스트 전날 안내 · followup: 상담 후 2~3일 안내(정보성)
 */
export type SmsKind = 'receipt' | 'reminder' | 'followup';
export const SMS_KIND_LABEL: Record<SmsKind, string> = { receipt: '접수 확인', reminder: '레벨테스트 전날 안내', followup: '상담 후 안내' };
export const isSmsKind = (k: unknown): k is SmsKind => k === 'receipt' || k === 'reminder' || k === 'followup';

/** 같은 상담·종류·키로는 한 번만 만든다. 새로 만들었으면 true */
export async function createSmsTask(tenantId: string, leadId: string, kind: SmsKind, dueAt: Date, refKey = ''): Promise<boolean> {
  try {
    await prisma.smsTask.create({ data: { tenantId, leadId, kind, refKey, dueAt } });
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return false; // 이미 있음
    throw e;
  }
}

/** 지금 보낼 문자 수 (관리자 배지) */
export function dueSmsCount(tenantId: string, now = new Date()) {
  return prisma.smsTask.count({ where: { tenantId, status: 'todo', dueAt: { lte: now } } });
}
