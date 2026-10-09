import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (membership.role === 'staff') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const accentColor: string = (body?.accentColor ?? '').trim();

  // Validate: must be empty or valid hex
  if (accentColor && !/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
    return NextResponse.json({ error: '올바른 HEX 색상 코드를 입력해주세요.' }, { status: 400 });
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { accentColor: accentColor || null },
  });

  return NextResponse.json({ ok: true });
}
