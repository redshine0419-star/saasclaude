import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'tasks';
  const projectId = searchParams.get('projectId');

  if (type === 'template') {
    const wb = XLSX.utils.book_new();

    // Projects sheet
    const projectData = [
      ['프로젝트명*', '설명', '색상(hex)', '시작일(YYYY-MM-DD)', '목표일(YYYY-MM-DD)', '상시여부(Y/N)'],
      ['예시 프로젝트', '프로젝트 설명', '#6366f1', '2026-01-01', '2026-06-30', 'N'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(projectData), '프로젝트');

    // Tasks sheet
    const taskData = [
      ['프로젝트명*', '업무제목*', '설명', '단계', '중요도', '시작일', '목표일', '담당자이메일', '요청자', '구분', '작업종류', '링크', '주요업무(Y/N)', '기획상태', '디자인상태', '퍼블상태', '개발상태'],
      ['예시 프로젝트', '홈페이지 리뉴얼', '메인 페이지 전면 개편', '기획', '높음', '2026-01-05', '2026-02-28', 'user@example.com', '김팀장', '해외대학', '기능개선', 'https://...', 'N', '완료', '진행중', '미시작', '미시작'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(taskData), '업무');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="work-template.xlsx"',
      },
    });
  }

  // Export tasks
  const workUser = await prisma.workUser.findUnique({ where: { email: session.user.email } });
  if (!workUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: { select: { name: true } },
      assignee: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows = tasks.map((t) => ({
    프로젝트: t.project.name,
    업무제목: t.title,
    설명: t.description ?? '',
    단계: t.status,
    중요도: t.priority,
    시작일: t.startDate ? t.startDate.toISOString().slice(0, 10) : '',
    목표일: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : '',
    담당자: t.assignee?.name ?? t.assignee?.email ?? '',
    요청자: t.requester,
    구분: t.category,
    작업종류: t.taskType,
    링크: t.externalLink,
    주요업무: t.isKeyTask ? 'Y' : 'N',
    기획상태: t.planningStatus,
    디자인상태: t.designStatus,
    퍼블상태: t.publishStatus,
    개발상태: t.devStatus,
    생성일: t.createdAt.toISOString().slice(0, 10),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '업무목록');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="tasks-export.xlsx"',
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });

  const workUser = await prisma.workUser.upsert({
    where: { email: session.user.email },
    update: {},
    create: { email: session.user.email, name: session.user.name ?? null },
  });

  let projectsCreated = 0;
  let tasksCreated = 0;
  const errors: string[] = [];

  // Process projects sheet if present
  if (wb.SheetNames.includes('프로젝트')) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['프로젝트'], { defval: '' });
    for (const row of rows) {
      const name = String(row['프로젝트명*'] ?? '').trim();
      if (!name) continue;
      try {
        const existing = await prisma.project.findFirst({
          where: { name, members: { some: { userId: workUser.id } } },
        });
        if (!existing) {
          await prisma.project.create({
            data: {
              name,
              description: String(row['설명'] ?? '').trim() || null,
              color: String(row['색상(hex)'] ?? '#6366f1').trim() || '#6366f1',
              startDate: row['시작일(YYYY-MM-DD)'] ? new Date(String(row['시작일(YYYY-MM-DD)'])) : null,
              dueDate: row['목표일(YYYY-MM-DD)'] ? new Date(String(row['목표일(YYYY-MM-DD)'])) : null,
              isOngoing: String(row['상시여부(Y/N)'] ?? '').toUpperCase() === 'Y',
              members: { create: { userId: workUser.id, role: 'owner' } },
            },
          });
          projectsCreated++;
        }
      } catch (e) {
        errors.push(`프로젝트 "${name}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // Process tasks sheet
  const taskSheet = wb.SheetNames.includes('업무') ? wb.Sheets['업무'] : wb.Sheets[wb.SheetNames[0]];
  if (taskSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(taskSheet, { defval: '' });
    for (const row of rows) {
      const title = String(row['업무제목*'] ?? '').trim();
      const projectName = String(row['프로젝트명*'] ?? '').trim();
      if (!title || !projectName) continue;

      try {
        const project = await prisma.project.findFirst({
          where: { name: projectName, members: { some: { userId: workUser.id } } },
        });
        if (!project) { errors.push(`태스크 "${title}": 프로젝트 "${projectName}"을 찾을 수 없습니다.`); continue; }

        let assigneeId: string | null = null;
        const assigneeEmail = String(row['담당자이메일'] ?? '').trim();
        if (assigneeEmail) {
          const au = await prisma.workUser.findUnique({ where: { email: assigneeEmail } });
          if (au) assigneeId = au.id;
        }

        const lastTask = await prisma.task.findFirst({
          where: { projectId: project.id },
          orderBy: { position: 'desc' },
          select: { position: true },
        });

        await prisma.task.create({
          data: {
            projectId: project.id,
            title,
            description: String(row['설명'] ?? '').trim() || null,
            status: String(row['단계'] ?? '기획').trim() || '기획',
            priority: String(row['중요도'] ?? '보통').trim() || '보통',
            startDate: row['시작일'] ? new Date(String(row['시작일'])) : null,
            dueDate: row['목표일'] ? new Date(String(row['목표일'])) : null,
            assigneeId,
            creatorId: workUser.id,
            requester: String(row['요청자'] ?? '').trim(),
            category: String(row['구분'] ?? '').trim(),
            taskType: String(row['작업종류'] ?? '').trim(),
            externalLink: String(row['링크'] ?? '').trim(),
            isKeyTask: String(row['주요업무(Y/N)'] ?? '').toUpperCase() === 'Y',
            planningStatus: String(row['기획상태'] ?? '미시작').trim() || '미시작',
            designStatus: String(row['디자인상태'] ?? '미시작').trim() || '미시작',
            publishStatus: String(row['퍼블상태'] ?? '미시작').trim() || '미시작',
            devStatus: String(row['개발상태'] ?? '미시작').trim() || '미시작',
            position: (lastTask?.position ?? 0) + 1000,
          },
        });
        tasksCreated++;
      } catch (e) {
        errors.push(`태스크 "${title}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return NextResponse.json({ projectsCreated, tasksCreated, errors });
}
