// 학원이 사용할 수 없는 경로 첫 세그먼트. middleware(edge)에서도 쓰므로 다른 모듈을 import하지 않는다.
export const RESERVED_SLUGS = new Set([
  'platform', 'admin', 'service', 'pricing', 'apply',
  'demo', 'consult', 'api', '_next', 'static', 'auth',
  'start', 'privacy', 'terms',
  'r', // 학부모 공유 리포트 growweb.me/r/{token}
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
