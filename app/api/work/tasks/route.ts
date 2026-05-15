import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function getWorkUser(email: string, name?: string | null, image?: string | null) {
  return prisma.workUser.upsert({
    where: { email },
    update: { name: name ?? undefined, avatarUrl: image ?? undefined },
    create: { email, name: name ?? null, avatarUrl: image ?? null },
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const assignedToMe = searchParams.get('assignedToMe') === 'true';

  const workUser = await getWorkUser(session.user.email, session.user.name, session.user.image);

  const where = {
    ...(projectId ? { projectId } : {}),
    ...(assignedToMe ? { assigneeId: workUser.id } : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      labels: { include: { label: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, title, description, status, priority, dueDate, assigneeId } = await req.json();
  if (!projectId || !title?.trim()) {
    return NextResponse.json({ error: 'projectId와 title은 필수입니다.' }, { status: 400 });
  }

  const workUser = await getWorkUser(session.user.email, session.user.name, session.user.image);

  const lastTask = await prisma.task.findFirst({
    where: { projectId, status: status ?? 'todo' },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = (lastTask?.position ?? 0) + 1000;

  const task = await prisma.task.create({
    data: {
      projectId,
      title: title.trim(),
      description: description?.trim() ?? null,
      status: status ?? 'todo',
      priority: priority ?? 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId ?? null,
      creatorId: workUser.id,
      position,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.priority !== undefined) data.priority = updates.priority;
  if (updates.dueDate !== undefined) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
  if (updates.assigneeId !== undefined) data.assigneeId = updates.assigneeId;
  if (updates.position !== undefined) data.position = updates.position;

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
