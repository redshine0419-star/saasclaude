import { prisma } from '@/lib/prisma';
import type { TemplatedSmsKind as SmsKind } from './constants';
export { SMS_VARS } from './constants';

/**
 * 학부모 문자 기본 문구 (정보성). 광고성 내용(특강·할인·모집 홍보)은 넣지 않는다 —
 * 광고성 문자는 (광고) 표기·수신 동의·야간 금지 규정이 따로 있다(SPEC 8장).
 * 학원이 고친 문구는 message_templates(providerTemplateCode='sms')에 둔다.
 */
export const DEFAULT_SMS_TEMPLATES: Record<SmsKind, string> = {
  receipt: '[#{학원명}] 안녕하세요, #{학부모명} 학부모님. 상담 신청 잘 받았습니다. #{학생학년} 자녀의 학습 상황을 여쭤보고 맞는 수업을 안내드리려고 합니다. 통화 편한 시간을 알려 주세요.',
  reminder: '[#{학원명}] #{학부모명} 학부모님, 내일 레벨테스트(#{테스트일시}) 안내드립니다. 30~40분 정도 걸리고, 끝나면 결과를 바로 설명드립니다. 일정 변경이 필요하시면 이 번호로 연락 주세요.',
  followup: '[#{학원명}] #{학부모명} 학부모님, 상담 때 말씀 나눈 내용 관련해 궁금하신 점이 있으면 편하게 연락 주세요. 수업 시작 가능일과 반 자리도 안내드리겠습니다.',
};

const SMS_MARK = 'sms';

export async function getSmsTemplates(tenantId: string): Promise<Record<SmsKind, string>> {
  const rows = await prisma.messageTemplate.findMany({
    where: { tenantId, providerTemplateCode: SMS_MARK, scenario: { in: ['receipt', 'reminder', 'followup'] } },
    select: { scenario: true, body: true },
  });
  const out = { ...DEFAULT_SMS_TEMPLATES };
  for (const r of rows) if (r.body.trim()) out[r.scenario as SmsKind] = r.body;
  return out;
}

export async function saveSmsTemplate(tenantId: string, kind: SmsKind, body: string) {
  const text = body.trim().slice(0, 1000) || DEFAULT_SMS_TEMPLATES[kind];
  await prisma.messageTemplate.upsert({
    where: { tenantId_scenario: { tenantId, scenario: kind } },
    update: { body: text, providerTemplateCode: SMS_MARK, kind: 'info' },
    create: { tenantId, scenario: kind, body: text, providerTemplateCode: SMS_MARK, kind: 'info' },
  });
}

const KST = 9 * 3600 * 1000;
export function kstWhenLabel(d: Date): string {
  const k = new Date(d.getTime() + KST);
  const w = ['일', '월', '화', '수', '목', '금', '토'][k.getUTCDay()];
  return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일(${w}) ${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`;
}

export function fillSms(body: string, v: { academy: string; parent: string; grade: string | null; testAt: Date | null }): string {
  return body
    .replace(/#\{학원명\}/g, v.academy)
    .replace(/#\{학부모명\}/g, v.parent)
    .replace(/#\{학생학년\}/g, v.grade || '')
    .replace(/#\{테스트일시\}/g, v.testAt ? kstWhenLabel(v.testAt) : '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ([,.])/g, '$1')
    .trim();
}
