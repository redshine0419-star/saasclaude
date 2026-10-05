import type { MessagingAdapter, DispatchOrder, AdapterResult } from '../types';

/**
 * 카카오 알림톡 어댑터 — Aligo 알림톡 API 기준 구현
 *
 * 환경변수:
 *   KAKAO_API_KEY      — Aligo API Key
 *   KAKAO_USER_ID      — Aligo 아이디
 *   KAKAO_SENDER_KEY   — 카카오 채널 발신 프로필 키
 *   KAKAO_SENDER_TEL   — 발신 번호 (등록된 번호)
 *   KAKAO_API_URL      — (선택) 기본값: https://kakaoapi.aligo.in/akv10/alimtalk/send/
 *   SMS_FALLBACK_TEL   — (선택) SMS 대체 발신 번호 (없으면 KAKAO_SENDER_TEL 사용)
 *
 * 실패 시 SMS(문자) 대체 발송: SPEC 7장
 * 친구톡/브랜드 메시지: TODO(확인 필요) — 사업자 결정 후 추가
 */

interface AligoAlimtalkResponse {
  result_code: string; // "1" = 성공
  message: string;
  data?: {
    msgid?: string;
    [key: string]: unknown;
  };
}

interface AligoSmsResponse {
  result_code: string; // "1" = 성공
  message: string;
  msg_id?: string;
}

export class KakaoAdapter implements MessagingAdapter {
  private readonly apiKey: string;
  private readonly userId: string;
  private readonly senderKey: string;
  private readonly senderTel: string;
  private readonly apiUrl: string;
  private readonly smsUrl: string;
  private readonly smsFallbackTel: string;

  constructor() {
    this.apiKey = process.env.KAKAO_API_KEY ?? '';
    this.userId = process.env.KAKAO_USER_ID ?? '';
    this.senderKey = process.env.KAKAO_SENDER_KEY ?? '';
    this.senderTel = process.env.KAKAO_SENDER_TEL ?? '';
    this.apiUrl = process.env.KAKAO_API_URL ?? 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';
    this.smsUrl = process.env.KAKAO_SMS_URL ?? 'https://apis.aligo.in/send/';
    this.smsFallbackTel = process.env.SMS_FALLBACK_TEL ?? this.senderTel;

    if (!this.apiKey || !this.userId || !this.senderKey || !this.senderTel) {
      throw new Error(
        'KakaoAdapter: KAKAO_API_KEY, KAKAO_USER_ID, KAKAO_SENDER_KEY, KAKAO_SENDER_TEL 환경변수가 필요합니다.\n' +
        '개발 환경에서는 MockAdapter를 사용하세요.',
      );
    }
  }

  async dispatch(order: DispatchOrder): Promise<AdapterResult> {
    // 예약 시각 계산 (현재 시각보다 1분 이상 뒤면 예약 발송)
    const nowMs = Date.now();
    const scheduledMs = order.scheduledAt.getTime();
    const isScheduled = scheduledMs - nowMs > 60_000;

    const reserveDate = isScheduled
      ? formatKSTDatetime(order.scheduledAt)
      : '';

    // ── 알림톡 발송 ──────────────────────────────────────────────────
    const alimtalkResult = await this.sendAlimtalk(order, reserveDate);

    if (alimtalkResult.result_code === '1') {
      return {
        status: 'sent',
        externalId: alimtalkResult.data?.msgid?.toString() ?? 'alimtalk-ok',
      };
    }

    // ── 알림톡 실패 → SMS 대체 발송 (SPEC 7장) ────────────────────
    const smsResult = await this.sendSmsFallback(order, reserveDate);

    if (smsResult.result_code === '1') {
      return {
        status: 'sent',
        externalId: `sms-${smsResult.msg_id ?? 'fallback'}`,
      };
    }

    return {
      status: 'failed',
      error: `alimtalk:${alimtalkResult.message} / sms:${smsResult.message}`,
    };
  }

  private async sendAlimtalk(
    order: DispatchOrder,
    reserveDate: string,
  ): Promise<AligoAlimtalkResponse> {
    const form = new URLSearchParams({
      apikey: this.apiKey,
      userid: this.userId,
      senderkey: this.senderKey,
      tpl_code: order.kind, // 템플릿 코드 = 시나리오 키
      sender: this.senderTel,
      receiver_1: order.phone,
      subject_1: '', // 제목 없음 (알림톡은 본문만)
      message_1: order.body,
      ...(reserveDate ? { reservedate: reserveDate, reservetime: '' } : {}),
    });

    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const json = await res.json() as AligoAlimtalkResponse;
      return json;
    } catch (err) {
      return { result_code: '-99', message: String(err) };
    }
  }

  private async sendSmsFallback(
    order: DispatchOrder,
    reserveDate: string,
  ): Promise<AligoSmsResponse> {
    // SMS는 90자, LMS는 2000자 이내 — body 길이에 따라 자동 선택
    const msgType = order.body.length <= 90 ? 'SMS' : 'LMS';

    const form = new URLSearchParams({
      key: this.apiKey,
      user_id: this.userId,
      sender: this.smsFallbackTel,
      receiver: order.phone,
      msg: order.body.slice(0, 2000),
      msg_type: msgType,
      ...(reserveDate ? { rdate: reserveDate.slice(0, 8), rtime: reserveDate.slice(8) } : {}),
    });

    try {
      const res = await fetch(this.smsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const json = await res.json() as AligoSmsResponse;
      return json;
    } catch (err) {
      return { result_code: '-99', message: String(err) };
    }
  }
}

/** KST 기준 예약 날짜시각 문자열 반환 — Aligo 형식: YYYYMMDDHHmm */
function formatKSTDatetime(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    kst.getUTCFullYear().toString() +
    pad(kst.getUTCMonth() + 1) +
    pad(kst.getUTCDate()) +
    pad(kst.getUTCHours()) +
    pad(kst.getUTCMinutes())
  );
}
