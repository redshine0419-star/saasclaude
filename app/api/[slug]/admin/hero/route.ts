import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { parseHero } from '@/lib/hero';
import { isStoredUrl } from '@/lib/storage';

type Params = Promise<{ slug: string }>;

// PATCH — 메인 히어로 강조 문구·제목·소개·대표 사진 (원장만, 저장 즉시 공개)
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership || membership.role !== 'owner') return NextResponse.json({ error: '홈페이지 구성은 원장만 바꿀 수 있습니다.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const parsed = parseHero(body, isStoredUrl);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await prisma.tenant.update({ where: { id: tenant.id }, data: parsed.data });
  return NextResponse.json({ ok: true, ...parsed.data });
}
