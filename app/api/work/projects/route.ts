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

  const { name, description, color, startDate, dueDate, isOngoing } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '프로젝트 이름을 입력하세요.' }, { status: 400 });

  const workUser = await getOrCreateWorkUser(session.user.email, session.user.name, session.user.image);

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? null,
      color: color ?? '#6366f1',
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      isOngoing: isOngoing ?? false,
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

  const { id, name, description, color, startDate, dueDate, isOngoing } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() ?? null;
  if (color !== undefined) data.color = color;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (isOngoing !== undefined) data.isOngoing = isOngoing;

  const project = await prisma.project.update({ where: { id }, data });

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
