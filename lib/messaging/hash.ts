import { createHmac } from 'crypto';

/**
 * 전화번호를 HMAC-SHA256으로 해시한다.
 * 로그·DB에는 이 값만 저장하고 원문 phone은 어댑터에만 전달한다.
 *
 * 환경변수 MESSAGING_SECRET가 없으면 예외를 던진다.
 * 개발 환경에서는 .env.local에 임의 값을 설정할 것.
 */
export function hashPhone(phone: string): string {
  const secret = process.env.MESSAGING_SECRET;
  if (!secret) {
    throw new Error('MESSAGING_SECRET 환경변수가 설정되지 않았습니다.');
  }
  return createHmac('sha256', secret)
    .update(phone.replace(/\D/g, '')) // 숫자만 정규화
    .digest('hex');
}
