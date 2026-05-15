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

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  labels: { include: { label: true } },
  _count: { select: { comments: true } },
} as const;

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
    include: TASK_INCLUDE,
    orderBy: [{ dueDate: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    projectId, title, description, status, priority, dueDate, assigneeId,
    category, taskType, requester, externalLink,
    planningStatus, designStatus, publishStatus, devStatus,
  } = body;

  if (!projectId || !title?.trim()) {
    return NextResponse.json({ error: 'projectId와 title은 필수입니다.' }, { status: 400 });
  }

  const workUser = await getWorkUser(session.user.email, session.user.name, session.user.image);

  const lastTask = await prisma.task.findFirst({
    where: { projectId, status: status ?? '기획' },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = (lastTask?.position ?? 0) + 1000;

  const task = await prisma.task.create({
    data: {
      projectId,
      title: title.trim(),
      description: description?.trim() ?? null,
      status: status ?? '기획',
      priority: priority ?? '보통',
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId ?? null,
      creatorId: workUser.id,
      position,
      category: category ?? '',
      taskType: taskType ?? '',
      requester: requester ?? '',
      externalLink: externalLink ?? '',
      planningStatus: planningStatus ?? '미시작',
      designStatus: designStatus ?? '미시작',
      publishStatus: publishStatus ?? '미시작',
      devStatus: devStatus ?? '미시작',
    },
    include: TASK_INCLUDE,
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const ALLOWED = [
    'title', 'description', 'status', 'priority', 'dueDate', 'assigneeId', 'position',
    'category', 'taskType', 'requester', 'externalLink',
    'planningStatus', 'designStatus', 'publishStatus', 'devStatus',
  ];

  const data: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (updates[key] !== undefined) {
      data[key] = key === 'dueDate'
        ? (updates[key] ? new Date(updates[key]) : null)
        : updates[key];
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: TASK_INCLUDE,
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
