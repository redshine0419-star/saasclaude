import { isReservedSlug } from '@/lib/reserved-slugs';

/**
 * 더클 통합 GA4 — 서비스 사이트와 모든 학원 홈페이지를 측정 ID 하나로 잰다 (학원별 측정 ID는 쓰지 않는다).
 * 측정 ID는 코드 기본값(더클 GA4 웹 스트림)을 쓰고, 환경변수 GA4_MEASUREMENT_ID에 올바른 값이 있으면 그 값을 쓴다.
 * 기본값은 운영 빌드에서만 쓴다(Vercel 미리보기 배포 제외) — 개발·미리보기 방문이 통계에 섞이지 않게. 내 PC(localhost)는 화면에서 건너뛴다.
 */
export const DEFAULT_GA4_MEASUREMENT_ID = 'G-LNFYKK06L6';

function envMeasurementId(): string | null {
  // 흔한 입력 실수(따옴표, 소문자 g-)는 고쳐서 받는다
  const id = process.env.GA4_MEASUREMENT_ID?.trim().replace(/^["']|["']$/g, '').toUpperCase();
  return id && /^G-[A-Z0-9]{4,20}$/.test(id) ? id : null;
}

const isProductionDeploy = () =>
  process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview' && process.env.VERCEL_ENV !== 'development';

export function ga4MeasurementId(): string | null {
  return envMeasurementId() ?? (isProductionDeploy() ? DEFAULT_GA4_MEASUREMENT_ID : null);
}

/** 운영자 화면 점검용 — 어떤 측정 ID가 쓰이는지 */
export function ga4Status(): { state: 'ok' | 'missing' | 'invalid'; id?: string; hint: string } {
  const raw = process.env.GA4_MEASUREMENT_ID?.trim().replace(/^["']|["']$/g, '');
  const env = envMeasurementId();
  if (env) return { state: 'ok', id: env, hint: '환경변수 GA4_MEASUREMENT_ID의 측정 ID를 씁니다. 서비스 사이트·블로그·학원 홈페이지에 GA4가 붙습니다.' };
  const bad = raw
    ? /^\d+$/.test(raw)
      ? `환경변수에 숫자(${raw.slice(0, 3)}…)만 들어가 있어(속성 ID) 무시합니다. `
      : '환경변수 값이 G-로 시작하는 측정 ID 형식이 아니라 무시합니다. '
    : '';
  if (isProductionDeploy()) return { state: 'ok', id: DEFAULT_GA4_MEASUREMENT_ID, hint: `${bad}코드에 넣어 둔 더클 측정 ID를 씁니다. 서비스 사이트·블로그·학원 홈페이지에 GA4가 붙습니다.` };
  return { state: raw ? 'invalid' : 'missing', hint: `${bad}운영 배포가 아니라(개발·미리보기) GA4를 붙이지 않습니다.` };
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
