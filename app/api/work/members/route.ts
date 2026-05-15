import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { role: 'asc' },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, email, role } = await req.json();
  if (!projectId || !email) return NextResponse.json({ error: 'projectId와 email이 필요합니다.' }, { status: 400 });

  // 초대할 사용자가 존재하는지 확인 (한 번이라도 로그인한 사람만 추가 가능)
  const targetUser = await prisma.workUser.findUnique({ where: { email: email.trim() } });
  if (!targetUser) {
    return NextResponse.json(
      { error: '해당 이메일로 가입한 사용자를 찾을 수 없어요. 먼저 서비스에 로그인해야 초대할 수 있습니다.' },
      { status: 404 }
    );
  }

  // 이미 멤버인지 확인
  const existing = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: targetUser.id, projectId } },
  });
  if (existing) return NextResponse.json({ error: '이미 프로젝트 멤버입니다.' }, { status: 409 });

  const member = await prisma.projectMember.create({
    data: { projectId, userId: targetUser.id, role: role ?? 'member' },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');
  if (!projectId || !userId) return NextResponse.json({ error: 'projectId and userId required' }, { status: 400 });

  await prisma.projectMember.delete({
    where: { userId_projectId: { userId, projectId } },
  });

  return NextResponse.json({ ok: true });
}
