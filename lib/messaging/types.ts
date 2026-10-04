// 발송 시나리오 종류 (SPEC 7장)
export type MessageKind =
  | 'receipt'       // 상담 접수 확인 — 정보성
  | 'owner_alert'   // 새 상담 알림 — 정보성
  | 'reminder'      // 테스트 전날 알림 — 정보성
  | 'followup'      // 미등록 후속 — 광고성, not_enrolled 후 3일
  | 'campaign'      // 모집 공지 — 광고성, 원장 수동
  | 'reconfirm';    // 수신 동의 재확인 — 정보성, 동의 2년 도래 30일 전

// 수신자의 동의 상태
export type RecipientConsent = {
  marketing: boolean; // 광고성 메시지 수신 동의
  night: boolean;     // 21:00~08:00 수신 동의
};

// 발송 요청 (rules.ts 입력)
export type SendRequest = {
  tenantId: string;
  recipientId: string;       // lead_id 또는 user_id (로그용)
  recipientHash: string;     // HMAC-SHA256 of phone (로그에 남기는 값)
  phone: string;             // 실제 발신 번호 (어댑터에만 전달, 로그 금지)
  kind: MessageKind;
  body: string;              // 원본 본문 (규칙이 수정할 수 있음)
  isAdvertisement: boolean;  // 광고성 여부
  consent: RecipientConsent;
  requestedAt: Date;         // 발송 요청 시각 (야간 판정 기준)
  scheduledAt?: Date;        // 명시적 예약 시각 (없으면 requestedAt 즉시)
};

// 규칙 적용 후 결과
export type RuleResult =
  | { ok: true; body: string; scheduledAt: Date }
  | { ok: false; reason: RejectionReason };

export type RejectionReason =
  | 'no_marketing_consent'  // 마케팅 동의 없음
  | 'night_blocked';        // 야간 미동의, 예약 이동은 불가한 즉시 발송

// 어댑터가 받는 최종 발송 명령
export type DispatchOrder = {
  tenantId: string;
  recipientId: string;
  recipientHash: string;
  phone: string;
  kind: MessageKind;
  body: string;              // 규칙이 (광고) + 수신거부 문구를 삽입한 후의 본문
  scheduledAt: Date;
};

// 어댑터 발송 결과
export type AdapterResult =
  | { status: 'sent'; externalId: string }
  | { status: 'failed'; error: string };

// 메시지 어댑터 인터페이스
export interface MessagingAdapter {
  dispatch(order: DispatchOrder): Promise<AdapterResult>;
}
