/**
 * Converts 운영 sheet from the source xlsx to the import template format.
 * Output: /tmp/ops-import.xlsx  → upload via the app's Excel import button
 */

const xlsx = require('xlsx');

const SRC = '/root/.claude/uploads/0e27fd0a-4086-403e-a9db-f988ad1917a5/c111b252-2.xlsx';
const DEST = '/tmp/ops-import.xlsx';

function excelDateToStr(serial) {
  if (!serial || typeof serial !== 'number') return '';
  const adjusted = serial > 60 ? serial - 1 : serial;
  const ms = (adjusted - 25569) * 86400 * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function mapPriority(val) {
  const map = { 긴급: '긴급', 필수: '긴급', 중요: '높음', 보통: '보통', 후순위: '낮음', 선택: '낮음' };
  return map[String(val || '').trim()] || '보통';
}

function mapStageStatus(val) {
  const s = String(val || '').trim();
  if (!s || s === '-' || s.toLowerCase() === 'n/a') return 'N/A';
  const map = { 완료: '완료', 진행중: '진행중', 검토요청: '검토요청', 피드백: '피드백',
                보류: '보류', 필요: '미시작', 요청: '미시작', 미시작: '미시작' };
  return map[s] || '미시작';
}

function mapStatus(raw, planSt, designSt, publSt, devSt) {
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

function clean(val) {
  const s = String(val || '').trim();
  return s === '-' ? '' : s;
}

// Read source
const wb = xlsx.readFile(SRC);
const ws = wb.Sheets['운영'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
const dataRows = rows.slice(2).filter(r => r && r[3]);

console.log(`Processing ${dataRows.length} rows...`);

// Build template rows
const taskRows = [];
for (const row of dataRows) {
  const planSt = mapStageStatus(row[7]);
  const designSt = mapStageStatus(row[8]);
  const publSt = mapStageStatus(row[9]);
  const devSt = mapStageStatus(row[10]);
  const stage = mapStatus(clean(row[5]), planSt, designSt, publSt, devSt);

  taskRows.push({
    '프로젝트명*': '운영',
    '업무제목*': String(row[3] || '').trim(),
    '설명': '',
    '단계': stage,
    '중요도': mapPriority(row[6]),
    '시작일': excelDateToStr(row[1]),
    '목표일': (() => {
      const dates = [excelDateToStr(row[11]), excelDateToStr(row[12]), excelDateToStr(row[13])].filter(Boolean);
      return dates.sort().reverse()[0] || '';
    })(),
    '담당자이메일': '',
    '요청자': clean(row[14]),
    '구분': clean(row[2]),
    '작업종류': clean(row[4]),
    '링크': clean(row[15]),
    '주요업무(Y/N)': 'N',
    '기획상태': planSt,
    '디자인상태': designSt,
    '퍼블상태': publSt,
    '개발상태': devSt,
  });
}

// Build output workbook
const outWb = xlsx.utils.book_new();

// Projects sheet
const projectData = [
  ['프로젝트명*', '설명', '색상(hex)', '시작일(YYYY-MM-DD)', '목표일(YYYY-MM-DD)', '상시여부(Y/N)'],
  ['운영', '엑셀에서 가져온 운영 업무', '#6366f1', '', '', 'Y'],
];
xlsx.utils.book_append_sheet(outWb, xlsx.utils.aoa_to_sheet(projectData), '프로젝트');

// Tasks sheet
xlsx.utils.book_append_sheet(outWb, xlsx.utils.json_to_sheet(taskRows), '업무');

xlsx.writeFile(outWb, DEST);
console.log(`Saved to ${DEST} — ${taskRows.length} tasks`);
console.log('Upload this file via the work management app.');
