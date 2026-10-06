import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string; id: string }>;

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email }, role: 'owner' },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.notifyRecipient.deleteMany({ where: { id, tenantId: tenant.id } });

  return NextResponse.json({ ok: true });
}
