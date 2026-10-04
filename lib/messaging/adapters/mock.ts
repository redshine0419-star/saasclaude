import type { MessagingAdapter, DispatchOrder, AdapterResult } from '../types';

/**
 * Mock 어댑터 — 실제 발송 없이 콘솔에 출력한다.
 * 개발·테스트 환경에서 사용. KAKAO_API_KEY 없어도 동작.
 *
 * 개인정보 보호: recipientHash만 출력하고 phone은 출력하지 않는다.
 */
export class MockAdapter implements MessagingAdapter {
  async dispatch(order: DispatchOrder): Promise<AdapterResult> {
    const externalId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    console.log(
      '[MockAdapter] dispatch',
      JSON.stringify({
        tenantId: order.tenantId,
        recipientId: order.recipientId,
        recipientHash: order.recipientHash,
        // phone 로깅 금지 (CLAUDE.md 개인정보 원칙)
        kind: order.kind,
        scheduledAt: order.scheduledAt.toISOString(),
        bodyPreview: order.body.slice(0, 60) + (order.body.length > 60 ? '…' : ''),
        externalId,
      }),
    );

    return { status: 'sent', externalId };
  }
}
