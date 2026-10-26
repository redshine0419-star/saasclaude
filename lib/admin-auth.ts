import { prisma } from '@/lib/prisma';
import { DEMO_ADMIN_SLUGS, DEMO_VIEWER_EMAIL } from '@/lib/demo-viewer';

type MembershipLike = { role: string };

/**
 * Returns the user's membership for a tenant, or a proxy membership object
 * when the email is listed in PLATFORM_ADMIN_EMAILS. Returns null if neither.
 */
export async function getAdminMembership(
  tenantId: string,
  email: string,
): Promise<MembershipLike | null> {
  // 데모 둘러보기: 화면은 원장 화면 그대로 보여 준다 (저장 API는 실제 로그인을 요구하므로 막힌다)
  if (email === DEMO_VIEWER_EMAIL) {
    const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
    return t && DEMO_ADMIN_SLUGS.has(t.slug) ? { role: 'owner' } : null;
  }
  const membership = await prisma.membership.findFirst({
    where: { tenantId, user: { email } },
  });
  if (membership) return membership;

  const isPlatformAdmin = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .includes(email);
  if (isPlatformAdmin) return { role: 'owner' };

  return null;
}
