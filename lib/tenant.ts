import { prisma } from '@/lib/prisma';
import type { Tenant } from '@prisma/client';

// 예약 slug — 학원이 사용 불가
export const RESERVED_SLUGS = new Set([
  'platform', 'admin', 'service', 'pricing', 'apply',
  'demo', 'consult', 'api', '_next', 'static', 'auth',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

// URL 경로 첫 세그먼트에서 slug 추출
// /hanbit-math/admin → "hanbit-math"
// /platform         → null (예약어)
// /                 → null (서비스 사이트)
export function extractSlugFromPathname(pathname: string): string | null {
  const segment = pathname.split('/')[1] ?? '';
  if (!segment || isReservedSlug(segment)) return null;
  return segment;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  if (isReservedSlug(slug)) return null;
  return prisma.tenant.findUnique({ where: { slug, status: 'active' } });
}
