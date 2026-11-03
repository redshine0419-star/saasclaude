/**
 * 정식 요금 구간 — 재원생(학생부 '재원' 상태) 수 기준 (SPEC 10장, 2026-11 결정).
 * 금액은 플랫폼 관리자 설정(platform_settings)에서 정한다. 비어 있으면 '미정'.
 * 베타 기간에는 구간과 상관없이 무료이며, 지금은 결제·차단을 하지 않고 안내만 한다.
 */
export type PlanTierKey = 'free' | 'standard' | 'plus';

export const PLAN_TIERS: { key: PlanTierKey; label: string; range: string; max: number; priceKey: string | null }[] = [
  { key: 'free', label: '무료', range: '재원생 5명까지', max: 5, priceKey: null },
  { key: 'standard', label: '스탠다드', range: '재원생 6~50명', max: 50, priceKey: 'price_tier_standard' },
  { key: 'plus', label: '플러스', range: '재원생 51명 이상', max: Infinity, priceKey: 'price_tier_plus' },
];

export function tierFor(activeStudents: number) {
  return PLAN_TIERS.find((t) => activeStudents <= t.max) ?? PLAN_TIERS[PLAN_TIERS.length - 1];
}

/** 설정값(원) → 표시. 무료 구간은 0원, 금액 미정이면 null */
export function tierPrice(key: PlanTierKey, settings: Record<string, string | undefined>): number | null {
  const tier = PLAN_TIERS.find((t) => t.key === key)!;
  if (!tier.priceKey) return 0;
  const n = Number(settings[tier.priceKey]);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function formatWon(n: number | null): string {
  if (n === null) return '금액 미정';
  if (n === 0) return '무료';
  return `월 ${n.toLocaleString('ko-KR')}원`;
}
