import { applyRules } from './rules';
import { MockAdapter } from './adapters/mock';
import { KakaoAdapter } from './adapters/kakao';
import type { SendRequest, MessagingAdapter } from './types';

function getAdapter(): MessagingAdapter {
  if (process.env.KAKAO_API_KEY) {
    return new KakaoAdapter();
  }
  return new MockAdapter();
}

/**
 * 메시지 발송 진입점.
 *
 * 1) SPEC 8장 규칙 적용 (rules.ts)
 * 2) 규칙 통과 시 어댑터 호출
 * 3) 실패/야간 지연은 호출자에게 반환
 */
export async function sendMessage(req: SendRequest) {
  const result = applyRules(req);

  if (!result.ok) {
    return { dispatched: false, reason: result.reason } as const;
  }

  const adapter = getAdapter();

  const adapterResult = await adapter.dispatch({
    tenantId: req.tenantId,
    recipientId: req.recipientId,
    recipientHash: req.recipientHash,
    phone: req.phone,
    kind: req.kind,
    body: result.body,
    scheduledAt: result.scheduledAt,
  });

  return { dispatched: true, ...adapterResult, scheduledAt: result.scheduledAt } as const;
}
