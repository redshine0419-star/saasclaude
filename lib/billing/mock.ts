import { randomBytes } from 'node:crypto';
import type { BillingAdapter } from './types';

/**
 * 모의 결제 — 실제로 청구하지 않는다. 카드 정보를 받지 않고 테스트 카드를 발급한다.
 * '결제 실패 테스트 카드'(testFail)는 결제할 때마다 실패한다.
 */
export class MockBillingAdapter implements BillingAdapter {
  readonly provider = 'mock';

  async registerCard({ testFail }: { customerKey: string; testFail?: boolean }) {
    const id = randomBytes(8).toString('hex');
    return testFail
      ? { billingKey: `mock_fail_${id}`, cardLabel: '모의카드(결제 실패 테스트) ****0000' }
      : { billingKey: `mock_${id}`, cardLabel: '모의카드 ****4242' };
  }

  async charge({ billingKey }: { billingKey: string; orderId: string; amount: number; orderName: string }) {
    if (billingKey.startsWith('mock_fail_')) return { ok: false as const, reason: '카드 한도 초과 (모의)' };
    return { ok: true as const };
  }
}
