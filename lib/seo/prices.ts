import { prisma } from '@/lib/prisma';
import { tierPrice } from '@/lib/plan-tier';

/** 요금(플랫폼 설정 값, 없으면 기본값) — 화면·JSON-LD·llms.txt가 같은 금액을 쓴다 */
export async function getPlanPrices(): Promise<{ standard: number; plus: number }> {
  const rows = await prisma.platformSetting
    .findMany({ where: { key: { in: ['price_tier_standard', 'price_tier_plus'] } } })
    .catch(() => []);
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { standard: tierPrice('standard', s), plus: tierPrice('plus', s) };
}
