/** 결제 대행(PG) 어댑터 — 카카오 발송처럼 교체 가능하게 숨긴다. 카드 번호는 우리 서버를 거치지 않는다 */
export type RegisteredCard = { billingKey: string; cardLabel: string };
export type ChargeResult = { ok: true } | { ok: false; reason: string };

export interface BillingAdapter {
  readonly provider: string;
  /** 카드 등록 → 빌링키 발급. 실제 PG는 PG 결제창에서 받은 인증 값을 넘긴다 */
  registerCard(input: { customerKey: string; testFail?: boolean }): Promise<RegisteredCard>;
  /** 빌링키로 결제 */
  charge(input: { billingKey: string; orderId: string; amount: number; orderName: string }): Promise<ChargeResult>;
}
