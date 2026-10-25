import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

export type StudentAccess = { tenantId: string; email: string; name: string | null; isOwner: boolean };

/**
 * 학생부 API 공통 권한 확인. 원장·실장 모두 보기·메모·성적·출결 가능,
 * 학생 기본 정보 수정·삭제는 원장만 (ownerOnly).
 */
export async function studentAccess(slug: string, opts: { ownerOnly?: boolean } = {}): Promise<StudentAccess | NextResponse> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  const membership = await getAdminMembership(tenant.id, email);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const isOwner = membership.role === 'owner';
  if (opts.ownerOnly && !isOwner) return NextResponse.json({ error: '원장만 할 수 있습니다.' }, { status: 403 });
  return { tenantId: tenant.id, email, name: session.user?.name ?? null, isOwner };
}
