import { MockBillingAdapter } from './mock';
import type { BillingAdapter } from './types';

/** PG 키(예: TOSS_SECRET_KEY)가 생기면 실제 어댑터로 바꾼다. 지금은 모의 결제만 */
export function getBillingAdapter(): BillingAdapter {
  return new MockBillingAdapter();
}

export const BILLING_IS_MOCK = true;
