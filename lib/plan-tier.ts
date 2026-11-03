/**
 * 정식 요금 구간 — 재원생(학생부 '재원' 상태) 수 기준 (SPEC 10장, 2026-11 결정).
 * 금액은 기본값(스탠다드 3만·플러스 5만 원, 2026-11 결정)이고, 플랫폼 관리자 설정(platform_settings)에 값이 있으면 그 값을 쓴다.
 * 구간은 현재 재원생 수로 바로 정한다. 결제는 카드 정기결제만(연동 전 — SPEC 10장).
 * 베타 기간에는 구간과 상관없이 무료이며, 지금은 결제·차단을 하지 않고 안내만 한다.
 */
export type PlanTierKey = 'free' | 'standard' | 'plus';

export const PLAN_TIERS: { key: PlanTierKey; label: string; range: string; max: number; priceKey: string | null; defaultPrice: number }[] = [
  { key: 'free', label: '무료', range: '재원생 5명까지', max: 5, priceKey: null, defaultPrice: 0 },
  { key: 'standard', label: '스탠다드', range: '재원생 6~50명', max: 50, priceKey: 'price_tier_standard', defaultPrice: 30000 },
  { key: 'plus', label: '플러스', range: '재원생 51명 이상', max: Infinity, priceKey: 'price_tier_plus', defaultPrice: 50000 },
];

export function tierFor(activeStudents: number) {
  return PLAN_TIERS.find((t) => activeStudents <= t.max) ?? PLAN_TIERS[PLAN_TIERS.length - 1];
}

/** 월 요금(원). 플랫폼 설정에 양수 값이 있으면 그 값, 없으면 기본값 */
export function tierPrice(key: PlanTierKey, settings: Record<string, string | undefined>): number {
  const tier = PLAN_TIERS.find((t) => t.key === key)!;
  if (!tier.priceKey) return 0;
  const n = Number(settings[tier.priceKey]);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : tier.defaultPrice;
}

export function formatWon(n: number | null): string {
  if (n === null) return '금액 미정';
  if (n === 0) return '무료';
  return `월 ${n.toLocaleString('ko-KR')}원`;
}
