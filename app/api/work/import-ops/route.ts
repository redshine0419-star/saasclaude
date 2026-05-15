import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const XLSX_PATH =
  '/root/.claude/uploads/0e27fd0a-4086-403e-a9db-f988ad1917a5/c111b252-2.xlsx';

function excelDateToDate(serial: unknown): Date | null {
  if (!serial || typeof serial !== 'number') return null;
  const adjusted = serial > 60 ? serial - 1 : serial;
  const ms = (adjusted - 25569) * 86400 * 1000;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

function mapPriority(val: string): string {
  const map: Record<string, string> = {
    긴급: '긴급', 필수: '긴급', 중요: '높음', 보통: '보통', 후순위: '낮음', 선택: '낮음',
  };
  return map[val] ?? '보통';
}

function mapStageStatus(val: string): string {
  if (!val || val === '-' || val.toLowerCase() === 'n/a') return 'N/A';
  const map: Record<string, string> = {
    완료: '완료', 진행중: '진행중', 검토요청: '검토요청', 피드백: '피드백',
    보류: '보류', 필요: '미시작', 요청: '미시작', 미시작: '미시작',
  };
  return map[val] ?? '미시작';
}

function mapStatus(
  raw: string, planSt: string, designSt: string, publSt: string, devSt: string
): string {
  if (raw === '완료') return '완료';
  if (raw === '보류') return '보류';
  const check = [['개발', devSt], ['퍼블', publSt], ['디자인', designSt], ['기획', planSt]];
  for (const [stage, st] of check) {
    if (st && st !== 'N/A' && st !== '미시작') return stage;
  }
  for (const [stage, st] of [...check].reverse()) {
    if (st && st !== 'N/A') return stage;
  }
  return '기획';
}

export async function POST(req: NextRequest) {
  // Simple secret check to prevent accidental triggers
  const secret = req.headers.get('x-import-secret');
  if (secret !== 'ops-import-2026') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!fs.existsSync(XLSX_PATH)) {
    return NextResponse.json({ error: 'File not found: ' + XLSX_PATH }, { status: 404 });
  }

  const buf = fs.readFileSync(XLSX_PATH);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['운영'];
  if (!ws) return NextResponse.json({ error: '운영 sheet not found' }, { status: 400 });

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][];
  // row[0] = merged header, row[1] = actual column headers, row[2+] = data
  const dataRows = rows.slice(2).filter(r => Array.isArray(r) && r[3]);

  // Find or create 운영 project
  let project = await prisma.project.findFirst({ where: { name: '운영' } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: '운영',
        description: '엑셀에서 가져온 운영 업무',
        color: '#6366f1',
        status: 'active',
      },
    });
  }

  const users = await prisma.workUser.findMany();
  const userByName: Record<string, string> = {};
  for (const u of users) {
    if (u.name) userByName[u.name] = u.id;
  }

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[];
    const title = String(row[3] ?? '').trim();
    if (!title) continue;

    const assigneeName = String(row[0] ?? '').trim();
    const dateSerial = row[1];
    const category = String(row[2] ?? '').trim();
    const taskType = String(row[4] ?? '').trim();
    const statusRaw = String(row[5] ?? '').trim();
    const priorityRaw = String(row[6] ?? '').trim();
    const planRaw = String(row[7] ?? '').trim();
    const designRaw = String(row[8] ?? '').trim();
    const publRaw = String(row[9] ?? '').trim();
    const devRaw = String(row[10] ?? '').trim();
    const planDueSerial = row[11];
    const designDueSerial = row[12];
    const devDueSerial = row[13];
    const requester = String(row[14] ?? '').trim();
    const link = String(row[15] ?? '').trim();

    const planStatus = mapStageStatus(planRaw);
    const designStatus = mapStageStatus(designRaw);
    const publishStatus = mapStageStatus(publRaw);
    const devStatus = mapStageStatus(devRaw);
    const stage = mapStatus(statusRaw, planStatus, designStatus, publishStatus, devStatus);
    const priority = mapPriority(priorityRaw);

    const startDate = excelDateToDate(dateSerial as number);
    const planDue = excelDateToDate(planDueSerial as number);
    const designDue = excelDateToDate(designDueSerial as number);
    const devDue = excelDateToDate(devDueSerial as number);

    const dueDates = [planDue, designDue, devDue].filter(Boolean) as Date[];
    const dueDate = dueDates.length > 0
      ? new Date(Math.max(...dueDates.map(d => d.getTime())))
      : null;

    const assigneeId = userByName[assigneeName] ?? null;

    const lastTask = await prisma.task.findFirst({
      where: { projectId: project.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    try {
      await prisma.task.create({
        data: {
          projectId: project.id,
          title,
          description: null,
          status: stage,
          priority,
          startDate,
          dueDate,
          position: (lastTask?.position ?? 0) + (i + 1) * 1000,
          isKeyTask: false,
          category,
          taskType,
          requester: requester === '-' ? '' : requester,
          externalLink: link === '-' ? '' : link,
          planningStatus: planStatus,
          planningDueDate: planDue,
          designStatus,
          designDueDate: designDue,
          publishStatus,
          devStatus,
          devDueDate: devDue,
          assigneeId,
        },
      });
      created++;
    } catch (e) {
      errors.push(`Row ${i + 3}: ${title.slice(0, 40)} → ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ projectId: project.id, created, errors });
}
