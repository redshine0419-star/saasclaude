import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { clientIp, ipHash } from './ip';

/**
 * 개인정보 접속 기록 — 원장·직원이 학생·상담 정보를 열람·수정·삭제·내보낸 사실만 남긴다(내용·연락처는 남기지 않는다).
 * 개인정보 안전성 확보조치 기준의 '접속기록 보관'. 기록 실패가 화면을 막지 않게 한다.
 */
export type AccessAction =
  | 'view_student' | 'update_student' | 'delete_student'
  | 'view_leads' | 'update_lead'
  | 'view_sms'
  | 'export_leads' | 'export_consents' | 'export_data';

export const ACCESS_ACTION_LABEL: Record<AccessAction, string> = {
  view_student: '학생 상세 열람',
  update_student: '학생 정보 수정',
  delete_student: '퇴원 처리(학생부 삭제)',
  view_leads: '상담 목록·연락처 열람',
  update_lead: '상담 정보 수정',
  view_sms: '보낼 문자(연락처 포함) 열람',
  export_leads: '상담 목록 내려받기(CSV)',
  export_consents: '수신 동의 이력 내려받기(CSV)',
  export_data: '학원 데이터 전체 내보내기',
};

export async function logAccess(
  tenantId: string,
  actorEmail: string,
  action: AccessAction,
  target: { type: string; id?: string | null },
  req?: Request,
) {
  try {
    let ip = 'unknown';
    if (req) ip = clientIp(req);
    else {
      const h = await headers();
      ip = (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim();
    }
    await prisma.accessLog.create({
      data: { tenantId, actorEmail, action, targetType: target.type, targetId: target.id ?? null, ipHash: ipHash(ip) },
    });
  } catch (e) {
    console.error('[access-log] 기록 실패', e instanceof Error ? e.message : e);
  }
}
