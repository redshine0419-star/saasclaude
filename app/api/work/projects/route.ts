import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function getOrCreateWorkUser(email: string, name?: string | null, image?: string | null) {
  return prisma.workUser.upsert({
    where: { email },
    update: { name: name ?? undefined, avatarUrl: image ?? undefined },
    create: { email, name: name ?? null, avatarUrl: image ?? null },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const workUser = await getOrCreateWorkUser(session.user.email, session.user.name, session.user.image);

  const memberships = await prisma.projectMember.findMany({
    where: { userId: workUser.id },
    include: {
      project: {
        include: {
          _count: { select: { tasks: true, members: true } },
        },
      },
    },
    orderBy: { project: { createdAt: 'desc' } },
  });

  return NextResponse.json(memberships.map((m) => ({ ...m.project, role: m.role })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '프로젝트 이름을 입력하세요.' }, { status: 400 });

  const workUser = await getOrCreateWorkUser(session.user.email, session.user.name, session.user.image);

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? null,
      color: color ?? '#6366f1',
      members: {
        create: { userId: workUser.id, role: 'owner' },
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, description, color } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() ?? null } : {}),
      ...(color !== undefined ? { color } : {}),
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
