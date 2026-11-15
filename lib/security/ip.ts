import { createHmac } from 'node:crypto';

/** 요청 IP (Vercel은 x-forwarded-for 첫 값이 실제 접속 IP) */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown').trim();
}

/** IP 원문을 저장하지 않도록 비밀값으로 해시한다 (같은 IP는 같은 값 → 횟수 제한·기록 비교만 가능) */
export function ipHash(ip: string): string {
  return createHmac('sha256', process.env.AUTH_SECRET ?? 'dev').update(ip).digest('base64url').slice(0, 22);
}
