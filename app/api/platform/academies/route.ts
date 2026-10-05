import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function checkPlatformAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const m = await prisma.membership.findFirst({
    where: { user: { email: session.user.email }, role: 'platform_admin' },
  });
  return m ? session.user.email : null;
}

const RESERVED_SLUGS = new Set([
  'platform', 'admin', 'service', 'pricing', 'apply', 'demo',
  'consult', 'api', '_next', 'static', 'auth', 'privacy', 'terms',
]);

export async function POST(req: NextRequest) {
  const email = await checkPlatformAdmin();
  if (!email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const { name, slug, theme, subjects, address, phone } = body;
  if (!name || !slug) return NextResponse.json({ error: '학원 이름과 슬러그는 필수입니다.' }, { status: 400 });
  if (RESERVED_SLUGS.has(slug)) return NextResponse.json({ error: '사용할 수 없는 슬러그입니다.' }, { status: 400 });
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) return NextResponse.json({ error: '슬러그는 영소문자, 숫자, 하이픈만 사용하고 2~40자여야 합니다.' }, { status: 400 });

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: '이미 사용 중인 슬러그입니다.' }, { status: 409 });

  const betaStartedAt = new Date();
  const betaEndsAt = new Date(betaStartedAt);
  betaEndsAt.setMonth(betaEndsAt.getMonth() + 3);

  const tenant = await prisma.tenant.create({
    data: {
      name: name.trim(),
      slug: slug.trim(),
      theme: theme ?? 'warm',
      subjects: subjects?.trim() || null,
      address: address?.trim() || null,
      phone: phone?.trim() || null,
      planStatus: 'beta',
      betaStartedAt,
      betaEndsAt,
      status: 'active',
    },
  });

  return NextResponse.json({ ok: true, id: tenant.id, slug: tenant.slug });
}
