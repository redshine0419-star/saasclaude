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
  subTasks: {
    include: { assignee: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

const DATE_FIELDS = new Set([
  'dueDate', 'startDate',
  'planningStartDate', 'planningDueDate',
  'designStartDate', 'designDueDate',
  'publishStartDate', 'publishDueDate',
  'devStartDate', 'devDueDate',
]);

const ALLOWED = [
  'title', 'description', 'status', 'priority', 'startDate', 'dueDate', 'assigneeId', 'position',
  'isKeyTask', 'category', 'taskType', 'requester', 'externalLink',
  'planningStatus', 'planningStartDate', 'planningDueDate',
  'designStatus', 'designStartDate', 'designDueDate',
  'publishStatus', 'publishStartDate', 'publishDueDate',
  'devStatus', 'devStartDate', 'devDueDate',
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const assignedToMe = searchParams.get('assignedToMe') === 'true';
  const memberId = searchParams.get('memberId');

  const workUser = await getWorkUser(session.user.email, session.user.name, session.user.image);

  let assigneeFilter: string | undefined;
  if (memberId) {
    assigneeFilter = memberId;
  } else if (assignedToMe) {
    assigneeFilter = workUser.id;
  }

  const where = {
    ...(projectId ? { projectId } : {}),
    ...(assigneeFilter ? { assigneeId: assigneeFilter } : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    include: { ...TASK_INCLUDE, project: { select: { id: true, name: true, color: true } } } as any,
    orderBy: [{ dueDate: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { projectId, title } = body;

  if (!projectId || !title?.trim()) {
    return NextResponse.json({ error: 'projectId와 title은 필수입니다.' }, { status: 400 });
  }

  const workUser = await getWorkUser(session.user.email, session.user.name, session.user.image);

  const lastTask = await prisma.task.findFirst({
    where: { projectId, status: body.status ?? '기획' },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = (lastTask?.position ?? 0) + 1000;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {
    projectId,
    title: title.trim(),
    description: body.description?.trim() ?? null,
    status: body.status ?? '기획',
    priority: body.priority ?? '보통',
    position,
    creatorId: workUser.id,
    assigneeId: body.assigneeId ?? null,
    isKeyTask: body.isKeyTask ?? false,
    category: body.category ?? '',
    taskType: body.taskType ?? '',
    requester: body.requester ?? '',
    externalLink: body.externalLink ?? '',
    planningStatus: body.planningStatus ?? '미시작',
    designStatus: body.designStatus ?? '미시작',
    publishStatus: body.publishStatus ?? '미시작',
    devStatus: body.devStatus ?? '미시작',
  };

  for (const f of DATE_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f] ? new Date(body[f] as string) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = await prisma.task.create({ data: data as any, include: TASK_INCLUDE });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (updates[key] !== undefined) {
      data[key] = DATE_FIELDS.has(key)
        ? (updates[key] ? new Date(updates[key] as string) : null)
        : updates[key];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = await prisma.task.update({ where: { id }, data: data as any, include: TASK_INCLUDE });

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
