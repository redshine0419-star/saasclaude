import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email }, role: 'owner' },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.phone) {
    return NextResponse.json({ error: '이름과 전화번호를 입력해주세요.' }, { status: 400 });
  }

  const recipient = await prisma.notifyRecipient.create({
    data: { tenantId: tenant.id, name: body.name, phone: body.phone },
  });

  return NextResponse.json({ recipient: { id: recipient.id, name: recipient.name, phone: recipient.phone } });
}
