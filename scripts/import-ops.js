/**
 * Import 운영 sheet from the uploaded Excel file into the database.
 * Run: node scripts/import-ops.js
 */

const { neon } = require('@neondatabase/serverless');
const xlsx = require('xlsx');
const { randomBytes } = require('crypto');

const DATABASE_URL =
  'postgresql://neondb_owner:npg_N6jzJnIPBR5Y@ep-muddy-cake-apwdxub7-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const XLSX_PATH =
  '/root/.claude/uploads/0e27fd0a-4086-403e-a9db-f988ad1917a5/c111b252-2.xlsx';

// Excel serial date → JS Date
function excelDateToISO(serial) {
  if (!serial || typeof serial !== 'number') return null;
  // Excel uses 1900-based serial with a leap-year bug (serial 60 = Feb 29, 1900 doesn't exist)
  // Adjust: serials > 60 are off by 1 day due to the bug
  const adjusted = serial > 60 ? serial - 1 : serial;
  const msFromEpoch = (adjusted - 25569) * 86400 * 1000;
  const d = new Date(msFromEpoch);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Map 중요도 → priority
function mapPriority(val) {
  const map = {
    긴급: '긴급',
    필수: '긴급',
    중요: '높음',
    보통: '보통',
    후순위: '낮음',
    선택: '낮음',
  };
  return map[val] || '보통';
}

// Map stage status values to system values
function mapStageStatus(val) {
  if (!val || val === '-' || val === 'n/a' || val === 'N/A') return 'N/A';
  const map = {
    완료: '완료',
    진행중: '진행중',
    검토요청: '검토요청',
    피드백: '피드백',
    보류: '보류',
    필요: '미시작',
    요청: '미시작',
    미시작: '미시작',
  };
  return map[val] || '미시작';
}

// Map 진행상태 → Kanban stage
function mapStatus(val, planSt, designSt, publSt, devSt) {
  if (val === '완료') return '완료';
  if (val === '보류') return '보류';
  // Determine stage from sub-statuses
  const active = [
    ['개발', devSt],
    ['퍼블', publSt],
    ['디자인', designSt],
    ['기획', planSt],
  ];
  for (const [stage, st] of active) {
    if (st && st !== 'N/A' && st !== '미시작') return stage;
  }
  // Fall back to first non-N/A stage
  for (const [stage, st] of active.reverse()) {
    if (st && st !== 'N/A') return stage;
  }
  return '기획';
}

function cuid() {
  return 'c' + randomBytes(10).toString('hex');
}

async function main() {
  const sql = neon(DATABASE_URL);

  // Read Excel
  const wb = xlsx.readFile(XLSX_PATH);
  const ws = wb.Sheets['운영'];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

  // Row index 1 is actual header, data starts at index 2
  const dataRows = rows.slice(2).filter(r => r && r[3]); // filter by 상세 업무 내용

  console.log(`Found ${dataRows.length} data rows to import`);

  // --- Find or create "운영" project ---
  const existing = await sql`SELECT id FROM "Project" WHERE name = '운영' LIMIT 1`;
  let projectId;
  if (existing.length > 0) {
    projectId = existing[0].id;
    console.log(`Using existing project: ${projectId}`);
  } else {
    projectId = cuid();
    await sql`
      INSERT INTO "Project" (id, name, description, color, status, "createdAt", "updatedAt")
      VALUES (${projectId}, '운영', '엑셀에서 가져온 운영 업무', '#6366f1', 'active', NOW(), NOW())
    `;
    console.log(`Created project: ${projectId}`);
  }

  // --- Cache known WorkUser emails ---
  const users = await sql`SELECT id, email, name FROM "WorkUser"`;
  const userByName = {};
  const userByEmail = {};
  for (const u of users) {
    userByEmail[u.email] = u.id;
    if (u.name) userByName[u.name] = u.id;
  }

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    // columns: 담당(0), 날짜(1), 구분(2), 상세 업무 내용(3), 기타(4), 진행상태(5), 중요도(6),
    //          기획(7), 디자인(8), 퍼블(9), 개발(10),
    //          기획완료(11), 디자인완료(12), 개발 완료(13), 요청자(14), 링크(15)

    const title = String(row[3] || '').trim();
    if (!title) { skipped++; continue; }

    const assigneeName = String(row[0] || '').trim();
    const dateSerial = row[1];
    const category = String(row[2] || '').trim();
    const taskType = String(row[4] || '').trim();
    const statusRaw = String(row[5] || '').trim();
    const priorityRaw = String(row[6] || '').trim();
    const planRaw = String(row[7] || '').trim();
    const designRaw = String(row[8] || '').trim();
    const publRaw = String(row[9] || '').trim();
    const devRaw = String(row[10] || '').trim();
    const planDueSerial = row[11];
    const designDueSerial = row[12];
    const devDueSerial = row[13];
    const requester = String(row[14] || '').trim();
    const link = String(row[15] || '').trim();

    const planStatus = mapStageStatus(planRaw);
    const designStatus = mapStageStatus(designRaw);
    const publishStatus = mapStageStatus(publRaw);
    const devStatus = mapStageStatus(devRaw);
    const stage = mapStatus(statusRaw, planStatus, designStatus, publishStatus, devStatus);
    const priority = mapPriority(priorityRaw);

    const startDateStr = excelDateToISO(dateSerial);
    const planDueStr = excelDateToISO(planDueSerial);
    const designDueStr = excelDateToISO(designDueSerial);
    const devDueStr = excelDateToISO(devDueSerial);

    const assigneeId = userByName[assigneeName] || null;
    const taskId = cuid();

    const startDate = startDateStr ? new Date(startDateStr) : null;
    const planDue = planDueStr ? new Date(planDueStr) : null;
    const designDue = designDueStr ? new Date(designDueStr) : null;
    const devDue = devDueStr ? new Date(devDueStr) : null;
    // Use the latest known due date as overall dueDate
    const dueDates = [planDue, designDue, devDue].filter(Boolean);
    const dueDate = dueDates.length > 0 ? new Date(Math.max(...dueDates.map(d => d.getTime()))) : null;

    try {
      await sql`
        INSERT INTO "Task" (
          id, title, description, status, priority,
          "startDate", "dueDate", position, "isKeyTask",
          category, "taskType", requester, "externalLink",
          "planningStatus", "planningDueDate",
          "designStatus", "designDueDate",
          "publishStatus",
          "devStatus", "devDueDate",
          "projectId", "assigneeId",
          "createdAt", "updatedAt"
        ) VALUES (
          ${taskId}, ${title}, ${''}, ${stage}, ${priority},
          ${startDate}, ${dueDate}, ${i}, ${false},
          ${category}, ${taskType}, ${requester}, ${link !== '-' ? link : ''},
          ${planStatus}, ${planDue},
          ${designStatus}, ${designDue},
          ${publishStatus},
          ${devStatus}, ${devDue},
          ${projectId}, ${assigneeId},
          NOW(), NOW()
        )
      `;
      created++;
      if (created % 20 === 0) console.log(`  Inserted ${created}/${dataRows.length}...`);
    } catch (err) {
      console.error(`  Error on row ${i + 3}: ${title.slice(0, 40)} →`, err.message);
      skipped++;
    }
  }

  console.log(`\nDone! Created ${created} tasks, skipped ${skipped}.`);
  console.log(`Project ID: ${projectId}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
