import { isReservedSlug } from '@/lib/reserved-slugs';

/**
 * 첫등원 통합 GA4 — 서비스 사이트와 모든 학원 홈페이지를 측정 ID 하나로 잰다 (학원별 측정 ID는 쓰지 않는다).
 * 측정 ID는 환경변수 GA4_MEASUREMENT_ID (G-XXXXXXXX). 없거나 형식이 틀리면 아무것도 붙이지 않는다.
 */
export function ga4MeasurementId(): string | null {
  // 흔한 입력 실수(따옴표, 소문자 g-)는 고쳐서 받는다
  const id = process.env.GA4_MEASUREMENT_ID?.trim().replace(/^["']|["']$/g, '').toUpperCase();
  return id && /^G-[A-Z0-9]{4,20}$/.test(id) ? id : null;
}

/** 운영자 화면 점검용 — 측정 ID가 들어갔는지, 형식이 맞는지 */
export function ga4Status(): { state: 'ok' | 'missing' | 'invalid'; id?: string; hint: string } {
  const raw = process.env.GA4_MEASUREMENT_ID?.trim().replace(/^["']|["']$/g, '');
  if (!raw) return { state: 'missing', hint: 'Vercel 환경변수 GA4_MEASUREMENT_ID가 없습니다. Production 환경에 넣고 다시 배포해 주세요.' };
  const id = ga4MeasurementId();
  if (id) return { state: 'ok', id, hint: '측정 ID가 들어가 있습니다. 서비스 사이트·블로그·학원 홈페이지에 GA4가 붙습니다.' };
  if (/^\d+$/.test(raw)) return { state: 'invalid', hint: `숫자(${raw.slice(0, 3)}…)만 들어가 있습니다 — 속성 ID입니다. GA4 › 관리 › 데이터 스트림 › 웹에서 G-로 시작하는 측정 ID를 넣어 주세요.` };
  return { state: 'invalid', hint: 'G-로 시작하는 측정 ID 형식이 아닙니다. 이 값은 쓰지 않습니다.' };
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
