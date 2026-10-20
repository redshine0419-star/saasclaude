import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

/** 레벨테스트 관리 API 공통: 로그인 → 학원 → 멤버십(원장·실장 모두 가능). 실패 시 응답을 돌려준다. */
export async function guardAdmin(slug: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true, slug: true } });
  if (!tenant) return { error: NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 }) } as const;
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  return { tenant, membership, email: session.user.email } as const;
}
