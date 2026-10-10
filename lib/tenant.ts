import { prisma } from '@/lib/prisma';
import type { Tenant } from '@prisma/client';
import { isReservedSlug } from '@/lib/reserved-slugs';

export { RESERVED_SLUGS, isReservedSlug } from '@/lib/reserved-slugs';

/** 학원 slug 형식 검사. 문제가 없으면 null, 있으면 사용자에게 보여줄 메시지. */
export function slugError(slug: string): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug) || slug.length < 3) {
    return '주소는 영문 소문자·숫자·하이픈(-)으로 3~40자, 하이픈으로 시작하거나 끝날 수 없습니다.';
  }
  if (isReservedSlug(slug) || slug.startsWith('demo-')) return '사용할 수 없는 주소입니다.';
  return null;
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
