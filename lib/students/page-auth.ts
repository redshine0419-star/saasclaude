import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

/** 학생부 화면 공통: 로그인·학원 관리자 확인 */
export async function studentPageAuth(slug: string) {
  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true } });
  if (!tenant) notFound();
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) redirect('/auth/signin');
  return { tenant, email: session.user.email, isOwner: membership.role === 'owner' };
}
