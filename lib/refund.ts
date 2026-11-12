/**
 * 교습비 반환(환불) 기준 — 학원 홈페이지 교습비와 함께 표시한다 (학원법 제15조 제3항: 인터넷 광고 시 교습비 반환 안내).
 * 원장이 따로 쓴 반환 규정(refund_policy_texts)이 없으면 법정 기준을 보여 준다.
 * TODO(확인 필요): 법정 기준 문구는 학원법 제18조·시행령 제18조 [별표 4] 원문과 대조해 확정
 */
export const STATUTORY_REFUND_LINES = [
  '교습 시작 전: 이미 낸 교습비 전액 반환',
  '총 교습시간의 1/3이 지나기 전: 이미 낸 교습비의 2/3 반환',
  '총 교습시간의 1/2이 지나기 전: 이미 낸 교습비의 1/2 반환',
  '총 교습시간의 1/2이 지난 후: 반환하지 않음',
  '교습기간이 1개월을 넘으면 반환 사유가 생긴 달은 위 기준, 나머지 달은 전액 반환',
  '학원 사정으로 교습을 할 수 없게 된 경우: 남은 기간만큼 나누어 반환',
];

export const STATUTORY_REFUND_SOURCE = '「학원의 설립·운영 및 과외교습에 관한 법률」 제18조 및 같은 법 시행령 제18조 기준';

/** 학원이 쓴 반환 규정 줄 목록, 없으면 법정 기준 */
export function refundLines(custom: string | null | undefined): { lines: string[]; isStatutory: boolean } {
  const own = (custom ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  return own.length > 0 ? { lines: own, isStatutory: false } : { lines: STATUTORY_REFUND_LINES, isStatutory: true };
}
