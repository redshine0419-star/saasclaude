import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const assignedToMe = searchParams.get('assignedToMe') === 'true';
  const memberId = searchParams.get('memberId');

  let assigneeId: string | undefined;
  if (memberId) {
    assigneeId = memberId;
  } else if (assignedToMe) {
    const wu = await prisma.workUser.findUnique({ where: { email: session.user.email } });
    if (wu) assigneeId = wu.id;
  }

  const subTasks = await prisma.subTask.findMany({
    where: {
      ...(taskId ? { taskId } : {}),
      ...(assigneeId ? { assigneeId } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      task: { select: { id: true, title: true, projectId: true, project: { select: { id: true, name: true, color: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(subTasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId, title, startDate, dueDate, status, assigneeId } = await req.json();
  if (!taskId || !title?.trim()) {
    return NextResponse.json({ error: 'taskId와 title은 필수입니다.' }, { status: 400 });
  }

  const subTask = await prisma.subTask.create({
    data: {
      taskId,
      title: title.trim(),
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status ?? '미시작',
      assigneeId: assigneeId ?? null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(subTask, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, title, startDate, dueDate, status, assigneeId } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title.trim();
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (status !== undefined) data.status = status;
  if (assigneeId !== undefined) data.assigneeId = assigneeId || null;

  const subTask = await prisma.subTask.update({
    where: { id },
    data,
    include: { assignee: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });

  return NextResponse.json(subTask);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.subTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
