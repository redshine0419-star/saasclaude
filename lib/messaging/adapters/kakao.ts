import type { MessagingAdapter, DispatchOrder, AdapterResult } from '../types';

/**
 * 카카오 알림톡 어댑터 (stub).
 *
 * 실제 대행사 연동 시 이 클래스를 구현한다.
 * 환경변수: KAKAO_SENDER_KEY, KAKAO_API_KEY, KAKAO_API_URL
 *
 * 현재 사용 상품: 알림톡만 (광고성 알림톡 포함, 카카오 심사 필요)
 * TODO(확인 필요): 친구톡/브랜드 메시지 추가 여부는 사업자 결정 후 확인
 */
export class KakaoAdapter implements MessagingAdapter {
  private readonly senderKey: string;
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor() {
    this.senderKey = process.env.KAKAO_SENDER_KEY ?? '';
    this.apiKey = process.env.KAKAO_API_KEY ?? '';
    this.apiUrl = process.env.KAKAO_API_URL ?? 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

    if (!this.senderKey || !this.apiKey) {
      throw new Error(
        'KakaoAdapter: KAKAO_SENDER_KEY, KAKAO_API_KEY 환경변수가 필요합니다.\n' +
        '개발 환경에서는 MockAdapter를 사용하세요.',
      );
    }
  }

  async dispatch(order: DispatchOrder): Promise<AdapterResult> {
    // TODO: 실제 대행사 API 호출 구현
    // 1. 예약 발송이면 scheduledAt을 대행사 예약 파라미터로 전달
    // 2. 알림톡 실패 시 문자(SMS) 대체 발송 (SPEC 7장)
    // 3. messages 테이블에 결과 기록
    throw new Error('KakaoAdapter.dispatch() 미구현. 실제 연동 시 작성하세요.');
  }
}
