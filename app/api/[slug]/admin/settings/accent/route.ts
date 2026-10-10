import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { accentError } from '@/lib/accent';
import { ensureBaselineVersion, recordSiteVersion } from '@/lib/site-versions';

type Params = Promise<{ slug: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: '강조색은 원장만 바꿀 수 있습니다.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const accentColor: string = (body?.accentColor ?? '').trim();

  const err = accentError(accentColor);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  await ensureBaselineVersion(tenant.id, session.user.email);
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { accentColor: accentColor ? accentColor.toUpperCase() : null },
  });
  await recordSiteVersion(tenant.id, session.user.email, 'accent');

  return NextResponse.json({ ok: true });
}
