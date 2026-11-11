import { isReservedSlug } from '@/lib/reserved-slugs';

/**
 * 첫등원 통합 GA4 — 서비스 사이트와 모든 학원 홈페이지를 측정 ID 하나로 잰다 (학원별 측정 ID는 쓰지 않는다).
 * 측정 ID는 환경변수 GA4_MEASUREMENT_ID (G-XXXXXXXX). 없거나 형식이 틀리면 아무것도 붙이지 않는다.
 */
export function ga4MeasurementId(): string | null {
  const id = process.env.GA4_MEASUREMENT_ID?.trim();
  return id && /^G-[A-Z0-9]{4,20}$/.test(id) ? id : null;
}

export type PageKind = { group: 'service' | 'blog' | 'academy' | 'demo'; slug?: string };

/**
 * 분석에 보낼 페이지인지 판단한다. 보내지 않는 곳:
 * - 관리자(/{slug}/admin, /platform), 로그인·계정(/auth, /account, /signup), API
 * - 비밀 링크가 주소에 들어가는 곳: 무료 진단 결과(/consult/result/…), 학부모 리포트(/r/…), 레벨테스트 응시(/{slug}/test/…), 학부모 등록(/{slug}/join/…), 링크 공유 자료(?k=)
 */
export function classifyPath(pathname: string, search = ''): PageKind | null {
  if (/[?&](k|token|t)=/.test(search)) return null;
  const seg = pathname.split('/').filter(Boolean);
  const first = seg[0];
  if (!first) return { group: 'service' };
  if (['platform', 'auth', 'account', 'signup', 'api', 'r', '_next'].includes(first)) return null;
  if (first === 'blog') return { group: 'blog' };
  if (first === 'consult' && seg[1] === 'result') return null; // 진단 결과 — 주소의 번호로 열린다
  if (isReservedSlug(first) && !first.startsWith('demo-')) return { group: 'service' };
  if (['admin', 'test', 'join'].includes(seg[1] ?? '')) return null;
  return { group: first.startsWith('demo-') ? 'demo' : 'academy', slug: first };
}

type Gtag = (...args: unknown[]) => void;

/** 전환 등 이벤트 보내기 — GA가 없으면 조용히 넘어간다 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof g !== 'function') return;
  const kind = classifyPath(window.location.pathname, window.location.search);
  if (!kind) return;
  g('event', name, { ...params, ...(kind.slug && { academy_slug: kind.slug }), content_group: kind.group });
}
