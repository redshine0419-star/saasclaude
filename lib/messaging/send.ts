import { applyRules } from './rules';
import { MockAdapter } from './adapters/mock';
import { KakaoAdapter } from './adapters/kakao';
import type { SendRequest, MessagingAdapter } from './types';
import { prisma } from '@/lib/prisma';

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

  // Determine channel from externalId prefix (set by KakaoAdapter)
  const channel = adapterResult.status === 'sent' && adapterResult.externalId.startsWith('sms-')
    ? ('sms_fallback' as const)
    : ('alimtalk' as const);

  const outcome = { dispatched: true, ...adapterResult, scheduledAt: result.scheduledAt, channel } as const;

  // Write message_sent LeadEvent so the lead detail timeline shows Kakao sends
  if (outcome.status === 'sent' && req.recipientId) {
    prisma.leadEvent.create({
      data: {
        leadId: req.recipientId,
        type: 'message_sent',
        payload: { scenario: req.kind, channel },
      },
    }).catch(() => { /* non-critical */ });
  }

  return outcome;
}
