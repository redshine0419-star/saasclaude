import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { sendMail } from '@/lib/mail/send';
import { renderInviteMail } from '@/lib/mail/invite';

type Params = Promise<{ slug: string }>;

// GET — list current members + pending invites
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership || membership.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [members, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { tenantId: tenant.id },
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.memberInvite.findMany({
      where: { tenantId: tenant.id, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt.toISOString(),
      inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me'}/auth/accept-invite?token=${i.token}`,
    })),
  });
}

// POST — send invite
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership || membership.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = (body?.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: '올바른 이메일을 입력하세요.' }, { status: 400 });
  }

  // 이미 멤버인지 확인
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.membership.findFirst({
      where: { tenantId: tenant.id, userId: existingUser.id },
    });
    if (existingMember) {
      return NextResponse.json({ error: '이미 이 학원의 관리자입니다.' }, { status: 409 });
    }
    // 이미 가입된 사용자 — 바로 멤버 추가
    await prisma.membership.create({
      data: { tenantId: tenant.id, userId: existingUser.id, role: 'staff' },
    });
    return NextResponse.json({ ok: true, status: 'added' });
  }

  // 미가입자 — 초대 토큰 생성 (7일 유효)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await prisma.memberInvite.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: { expiresAt, token: crypto.randomUUID() },
    create: { tenantId: tenant.id, email, role: 'staff', expiresAt },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  const inviteUrl = `${baseUrl}/auth/accept-invite?token=${invite.token}`;

  // 초대 메일 — 실패해도 초대는 유효하다(화면에서 링크를 직접 보낼 수 있게 돌려준다). 로그에 이메일·링크를 남기지 않는다
  const mail = renderInviteMail({ academyName: tenant.name, inviteUrl, expiresAt });
  const sent = await sendMail({ to: [email], subject: mail.subject, html: mail.html, text: mail.text });

  return NextResponse.json({ ok: true, status: 'invited', inviteUrl, mailed: sent.sent });
}

// DELETE — remove member
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const ownerMembership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email }, role: 'owner' },
  });
  if (!ownerMembership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (body?.memberId) {
    const target = await prisma.membership.findFirst({
      where: { id: body.memberId, tenantId: tenant.id },
    });
    if (!target) return NextResponse.json({ error: '멤버를 찾을 수 없습니다.' }, { status: 404 });
    if (target.role === 'owner' && target.id === ownerMembership.id) {
      return NextResponse.json({ error: '본인 소유자 권한은 삭제할 수 없습니다.' }, { status: 400 });
    }
    await prisma.membership.delete({ where: { id: target.id } });
  } else if (body?.inviteId) {
    await prisma.memberInvite.deleteMany({
      where: { id: body.inviteId, tenantId: tenant.id },
    });
  } else {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
