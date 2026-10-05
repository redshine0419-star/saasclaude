import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const platformMembership = await prisma.membership.findFirst({
    where: { user: { email: session.user.email }, role: 'platform_admin' },
  });
  if (!platformMembership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body?.note?.trim()) return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });

  const ALLOWED_CHANNELS = new Set(['phone', 'kakao', 'email', 'visit', 'other']);
  const channel: string = ALLOWED_CHANNELS.has(body.channel) ? body.channel : 'other';

  const log = await prisma.tenantContactLog.create({
    data: {
      tenantId: tenant.id,
      authorEmail: session.user.email,
      channel,
      note: body.note.trim(),
    },
  });

  return NextResponse.json({
    ok: true,
    log: {
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      authorEmail: log.authorEmail,
      channel: log.channel,
      note: log.note,
    },
  });
}
