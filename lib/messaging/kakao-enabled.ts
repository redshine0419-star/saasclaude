/**
 * 카카오 알림톡·브랜드 메시지 발송 스위치 (2026-11부터 기본 꺼짐).
 * 원장 알림은 알림함·앱 알림·이메일(lib/notify/owner), 학부모 안내는 '보낼 문자'(lib/sms)로 한다.
 * 다시 켜려면 환경변수 KAKAO_SENDING=on — 관련 화면·발송 코드가 그대로 살아난다.
 */
export function kakaoEnabled(): boolean {
  return process.env.KAKAO_SENDING === 'on';
}
