import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

/** 결제 API 공통: 원장만 */
export async function billingOwner(slug: string) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true, slug: true, planStatus: true, betaEndsAt: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  const m = await getAdminMembership(tenant.id, email);
  if (!m || m.role !== 'owner') return NextResponse.json({ error: '결제는 원장만 관리할 수 있습니다.' }, { status: 403 });
  return { tenant, email };
}
