import type { MessageScenario } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * 플랫폼 공용 정보성 알림톡 템플릿.
 * 모든 학원이 플랫폼 발신 프로필 하나로 보내므로(어댑터 tpl_code = 시나리오 키),
 * 학원별 심사 없이 이 문구로 첫날부터 발송한다. 학원이 따로 승인받은 문구가 있으면 그것이 우선.
 *
 * TODO(확인 필요): 아래 문구는 카카오(대행사)에 등록·승인된 템플릿과 글자 단위로 같아야 한다.
 * 광고성(followup, campaign)은 알림톡으로 보낼 수 없어 기본 문구를 두지 않는다.
 * reconfirm(수신 동의 재확인)은 정보통신망법 필수 고지 항목 확인 전까지 기본 문구를 두지 않는다.
 */
export const PLATFORM_TEMPLATES: Partial<Record<MessageScenario, string>> = {
  receipt:
    '[#{학원명}] #{학부모명}님, 상담 신청이 접수되었습니다.\n\n■ 학생 학년: #{학생학년}\n■ 상담 유형: #{상담유형}\n\n확인 후 학원에서 연락드리겠습니다.',
  owner_alert:
    '[첫등원] 새 상담 신청이 들어왔습니다.\n\n■ 학원: #{학원명}\n■ 학부모: #{학부모명}\n■ 학년: #{학생학년}\n■ 유형: #{상담유형}\n\n관리자 화면에서 확인해 주세요.',
  reminder:
    '[#{학원명}] #{학부모명}님, 레벨테스트 일정을 안내드립니다.\n\n■ 일시: #{테스트일시}\n\n일정 변경이 필요하시면 학원으로 연락해 주세요.',
  owner_reminder:
    '[첫등원] 아직 연락하지 않은 상담이 있습니다.\n\n■ 학원: #{학원명}\n■ 학부모: #{학부모명}\n\n관리자 화면에서 확인해 주세요.',
};

export const CONSULT_TYPE_LABEL: Record<string, string> = {
  level_test: '레벨테스트',
  phone: '전화 상담',
  visit: '방문 상담',
  waitlist: '수업 대기 신청',
};

export type ResolvedTemplate = { body: string; source: 'tenant' | 'platform' };

/** 학원이 승인받은 문구 → 플랫폼 공용 문구 순서. 둘 다 없으면 발송하지 않는다(승인 안 된 문구는 절대 쓰지 않음). */
export async function resolveTemplate(tenantId: string, scenario: MessageScenario): Promise<ResolvedTemplate | null> {
  const own = await prisma.messageTemplate.findUnique({
    where: { tenantId_scenario: { tenantId, scenario } },
    select: { reviewStatus: true, approvedBody: true },
  });
  if (own?.reviewStatus === 'approved' && own.approvedBody) return { body: own.approvedBody, source: 'tenant' };
  const platform = PLATFORM_TEMPLATES[scenario];
  return platform ? { body: platform, source: 'platform' } : null;
}

export type TemplateVars = {
  학부모명?: string | null;
  학원명?: string | null;
  학생학년?: string | null;
  상담유형?: string | null;
  테스트일시?: string | null;
};

export function fillTemplate(body: string, vars: TemplateVars): string {
  const consult = vars.상담유형 ? CONSULT_TYPE_LABEL[vars.상담유형] ?? vars.상담유형 : '';
  return body
    .replace(/#\{학부모명\}/g, vars.학부모명 ?? '')
    .replace(/#\{학원명\}/g, vars.학원명 ?? '')
    .replace(/#\{학생학년\}/g, vars.학생학년 || '미기재')
    .replace(/#\{상담유형\}/g, consult)
    .replace(/#\{테스트일시\}/g, vars.테스트일시 ?? '');
}
