import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isPlatformAdmin } from '@/lib/platform-admin';

export const dynamic = 'force-dynamic';

// GET — 서비스 사이트 머리말용: 로그인 여부와 내가 관리하는 학원 (원장·직원)
export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ loggedIn: false }, { headers: { 'Cache-Control': 'no-store' } });
  const memberships = await prisma.membership.findMany({
    where: { user: { email }, role: { in: ['owner', 'staff'] } },
    select: { role: true, tenant: { select: { slug: true, name: true, status: true, published: true } } },
  });
  const academies = memberships
    .map((m) => ({ slug: m.tenant.slug, name: m.tenant.name, role: m.role, live: m.tenant.status === 'active' && m.tenant.published }))
    // 원장인 학원을 먼저
    .sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner'));
  return NextResponse.json(
    { loggedIn: true, name: session.user?.name ?? null, email, academies, isPlatformAdmin: await isPlatformAdmin(email) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
