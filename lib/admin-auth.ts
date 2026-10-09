import { prisma } from '@/lib/prisma';

type MembershipLike = { role: string };

/**
 * Returns the user's membership for a tenant, or a proxy membership object
 * when the email is listed in PLATFORM_ADMIN_EMAILS. Returns null if neither.
 */
export async function getAdminMembership(
  tenantId: string,
  email: string,
): Promise<MembershipLike | null> {
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
