#!/usr/bin/env node
/**
 * test2 학원에 "실제로 운영 중인 학원"처럼 보이는 샘플 데이터를 한 번 채운다 (빌드 때 실행).
 *
 * - test2 테넌트만 건드린다. 없으면 아무것도 하지 않는다.
 * - platform_settings 'seed:test2:v1' 표시가 있으면 다시 실행하지 않는다.
 * - 원장이 이미 입력한 값은 덮어쓰지 않는다 (비어 있는 칸·비어 있는 표만 채운다).
 * - 학부모·학생 번호는 모두 010-0000-xxxx(미할당 국번) — lib/messaging/send.ts가 실제 발송을 막는다.
 * - 자동 발송을 타지 않게: 테스트 예약 상담은 시간대(slot) 없이, 미등록 상담은 마케팅 동의 없이 만든다.
 * - 실패해도 빌드는 계속한다.
 */
import { randomBytes, createHmac } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const SLUG = 'test2';
// v1: 학생 10명 / v2: 학생 20명까지 채움 (v1이 이미 돌았으면 빠진 학생만 더 넣는다)
const MARKER = 'seed:test2:v2';

if (!process.env.DATABASE_URL) {
  console.log('[seed-test2] DATABASE_URL 없음 — 건너뜀');
  process.exit(0);
}
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

// ── 날짜 도우미 (KST 기준) ────────────────────────────────────
const KST = 9 * 3600 * 1000;
const NOW = new Date();
/** n일 전 KST hh:mm */
function at(daysAgo, hh = 15, mm = 0) {
  const k = new Date(NOW.getTime() + KST);
  const d = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() - daysAgo, hh, mm) - KST;
  return new Date(d);
}
/** n일 전 날짜(UTC 자정, DB date 칼럼용) */
function day(daysAgo) {
  const k = new Date(NOW.getTime() + KST);
  return new Date(Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate() - daysAgo));
}
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const token = () => randomBytes(24).toString('base64url');
const phone = (n) => `010-0000-${String(n).padStart(4, '0')}`;
function hashPhone(p) {
  const secret = process.env.MESSAGING_SECRET;
  return secret ? createHmac('sha256', secret).update(p.replace(/\D/g, '')).digest('hex') : `seed-${p.replace(/\D/g, '')}`;
}
// 결정적 의사난수 (실행마다 같은 모양)
let seed = 20261027;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: SLUG } });
  if (!tenant) return console.log('[seed-test2] test2 학원 없음 — 건너뜀');
  if (await prisma.platformSetting.findUnique({ where: { key: MARKER } })) return console.log('[seed-test2] 이미 채움 — 건너뜀');

  const T = tenant.id;
  const subjects = tenant.subjects || '수학';
  const english = /영어/.test(subjects) && !/수학/.test(subjects);
  const S = english ? '영어' : '수학';
  const owner = await prisma.membership.findFirst({ where: { tenantId: T, role: 'owner' }, include: { user: true } });
  const ownerEmail = owner?.user.email ?? 'owner@growweb.me';
  const ownerName = owner?.user.name ?? '원장';
  const count = async (model) => prisma[model].count({ where: { tenantId: T } });

  // ── 1. 학원 기본 정보 (빈 칸만) ──────────────────────────────
  const fill = {};
  if (!tenant.targetGrades) fill.targetGrades = '초5~고2';
  if (!tenant.hours) fill.hours = '평일 14:00~22:00 / 토 10:00~17:00 (일·공휴일 휴무)';
  if (!tenant.locationHeadline) fill.locationHeadline = '역에서 걸어서 5분, 상가 3층';
  if (!tenant.transitInfo) fill.transitInfo = '지하철 2호선 3번 출구 도보 5분 · 마을버스 07번 정류장 앞';
  if (!tenant.parkingInfo) fill.parkingInfo = '건물 지하 주차장 30분 무료 (상담·픽업 시)';
  if (Object.keys(fill).length) await prisma.tenant.update({ where: { id: T }, data: fill });

  // ── 2. 홈페이지 섹션: 테마의 모든 섹션 켜기 ─────────────────
  const ORDER = {
    warm: ['hero', 'quick_info', 'director', 'principles', 'classes', 'timetable', 'fees', 'reviews', 'news', 'faq', 'consult_form', 'location'],
    result: ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'faq', 'consult_form'],
    bright: ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'reviews', 'faq', 'consult_form'],
  }[tenant.theme] ?? [];
  for (const [i, key] of ORDER.entries()) {
    await prisma.tenantSection.upsert({
      where: { tenantId_sectionKey: { tenantId: T, sectionKey: key } },
      create: { tenantId: T, sectionKey: key, enabled: true, sortOrder: i },
      update: { enabled: true },
    });
  }

  // ── 3. 원장·원칙·시설·강사 ──────────────────────────────────
  if (!(await prisma.directorProfile.findUnique({ where: { tenantId: T } }))) {
    await prisma.directorProfile.create({
      data: {
        tenantId: T,
        headline: '아이가 왜 틀렸는지 알 때까지 같이 봅니다',
        philosophy: `${S}는 외우는 과목이 아니라 생각하는 힘을 기르는 과목이라고 믿습니다. 정답보다 풀이 과정을 먼저 보고, 틀린 문제는 아이 입으로 다시 설명할 수 있을 때까지 함께 봅니다. 한 반 8명 이하로 운영해 모든 학생의 노트를 매 수업 확인합니다.`,
        education: `서울 소재 대학교 ${S}교육과 졸업\n동 대학원 ${S}교육 석사`,
        career: `대형 학원 중등부 ${S} 강사 7년\n현 학원 원장 6년 (2019~)\n중·고등 내신 대비 교재 공동 집필`,
        subjectsTaught: `중등 ${S} 전 과정, 고1 ${S}`,
      },
    });
  }
  if ((await count('teachingPrinciple')) === 0) {
    const ps = [
      ['01', '풀이 과정을 먼저 봅니다', '답이 맞아도 과정이 틀리면 다시 풉니다. 서술형 감점을 줄이는 가장 확실한 방법입니다.'],
      ['02', '틀린 문제는 3번 만납니다', '수업 당일, 3일 뒤, 2주 뒤에 같은 유형을 다시 풀어 완전히 내 것으로 만듭니다.'],
      ['03', '학부모님께 매달 리포트를 드립니다', '출결·성적·수업 태도를 정리해 한 달에 한 번 링크로 보내 드립니다.'],
    ];
    await prisma.teachingPrinciple.createMany({ data: ps.map(([number, title, description], i) => ({ tenantId: T, number, title, description, sortOrder: i })) });
  }
  if ((await count('facility')) === 0) {
    await prisma.facility.createMany({ data: ['수업 교실 (8인실) 3개', '자기주도 학습실', '1:1 질문 상담실', '정수기·휴게 공간'].map((label, i) => ({ tenantId: T, label, sortOrder: i })) });
  }
  if ((await count('staffProfile')) === 0) {
    await prisma.staffProfile.createMany({
      data: [
        { name: '김서연', roleLabel: `중등 ${S} 담당`, summary: `${S}교육과 졸업, 강의 경력 5년. 개념을 그림으로 설명하는 수업으로 중1·중2 반을 맡고 있습니다.` },
        { name: '박준호', roleLabel: `고등 ${S} 담당`, summary: `내신·모의고사 대비 전문. 학교별 기출 분석 자료를 직접 만들어 수업합니다.` },
        { name: '이하늘', roleLabel: '실장 · 상담', summary: '등록 상담과 학부모 연락, 출결 관리를 맡고 있습니다.' },
      ].map((s, i) => ({ ...s, tenantId: T, sortOrder: i })),
    });
  }

  // ── 4. 수업·교습비·추가 비용·환불 규정 ────────────────────────
  let classes = await prisma.classItem.findMany({ where: { tenantId: T }, orderBy: { sortOrder: 'asc' } });
  if (classes.length === 0) {
    const CL = [
      { name: `초6 예비중 ${S}`, gradeBand: '초6', days: ['화', '목'], startTime: '16:00', endTime: '17:40', capacity: 8, seatsLeft: 3, textbook: english ? 'Reading Explorer 1' : '개념원리 중1-1', description: '중학교 첫 시험을 준비하는 반. 연산 정확도와 문장제 읽기를 함께 잡습니다.' },
      { name: `중1 기본 ${S}`, gradeBand: '중1', days: ['월', '수', '금'], startTime: '17:00', endTime: '18:40', capacity: 8, seatsLeft: 1, textbook: english ? '중1 교과서 + Grammar Inside 1' : '개념원리 중1-2 + 쎈', description: '개념 → 유형 → 서술형 순서로 진도를 나가고, 매주 금요일 단원 테스트를 봅니다.' },
      { name: `중2 심화 ${S}`, gradeBand: '중2', days: ['월', '수', '금'], startTime: '19:00', endTime: '20:40', capacity: 8, seatsLeft: 0, waitlistCount: 2, textbook: english ? '중2 교과서 + 수능 기초 독해' : '개념원리 중2-2 + 일품', description: '학교 내신 90점 이상을 목표로 하는 반. 시험 4주 전부터 학교별 기출을 풉니다.' },
      { name: `중3 내신·선행 ${S}`, gradeBand: '중3', days: ['화', '목', '토'], startTime: '18:00', endTime: '20:00', capacity: 8, seatsLeft: 2, textbook: english ? '고1 모의고사 기출' : '개념원리 중3-2 / 수학(상)', description: '중3 내신을 마무리하고 고1 과정을 미리 준비합니다.' },
    ];
    for (const [i, c] of CL.entries()) await prisma.classItem.create({ data: { ...c, tenantId: T, sortOrder: i } });
    classes = await prisma.classItem.findMany({ where: { tenantId: T }, orderBy: { sortOrder: 'asc' } });
  }
  if ((await count('fee')) === 0) {
    const amounts = [280000, 320000, 340000, 380000];
    await prisma.fee.createMany({
      data: classes.slice(0, 4).map((c, i) => ({ tenantId: T, classId: c.id, label: c.name, sessionsPerWeek: c.days.length, monthlyHours: c.days.length * 7, amount: amounts[i] ?? 320000, note: '교재비 별도' })),
    });
  }
  if ((await count('extraCost')) === 0) {
    await prisma.extraCost.createMany({ data: [
      { tenantId: T, label: '교재비', amount: 15000, note: '권당, 실비' },
      { tenantId: T, label: '모의고사 응시료', amount: 5000, note: '희망자만, 회당' },
    ] });
  }
  if (!(await prisma.refundPolicyText.findUnique({ where: { tenantId: T } }))) {
    await prisma.refundPolicyText.create({ data: { tenantId: T, body: '수업 시작 전: 이미 낸 교습비 전액\n총 교습시간 1/3 지나기 전: 2/3 환불\n총 교습시간 1/2 지나기 전: 1/2 환불\n총 교습시간 1/2 지난 후: 환불 없음' } });
  }

  // ── 5. 레벨테스트 시간·셔틀·FAQ ─────────────────────────────
  if ((await prisma.levelTestSlot.count({ where: { tenantId: T } })) === 0) {
    await prisma.levelTestSlot.createMany({ data: [
      { tenantId: T, weekday: 2, time: '15:00', capacity: 3 },
      { tenantId: T, weekday: 4, time: '15:00', capacity: 3 },
      { tenantId: T, weekday: 6, time: '11:00', capacity: 4 },
    ] });
  }
  if ((await count('shuttleStop')) === 0) {
    await prisma.shuttleStop.createMany({ data: [
      { tenantId: T, stop: '○○초등학교 정문', pickup: '15:40', dropoff: '17:50', sortOrder: 0 },
      { tenantId: T, stop: '○○아파트 102동 앞', pickup: '15:50', dropoff: '18:00', sortOrder: 1 },
      { tenantId: T, stop: '○○중학교 후문', pickup: '16:40', dropoff: '20:50', sortOrder: 2 },
    ] });
  }
  if ((await count('faqItem')) === 0) {
    const fq = [
      ['레벨테스트는 꼭 봐야 하나요?', '네, 반 배정을 위해 30~40분 정도 레벨테스트를 봅니다. 결과는 바로 학부모님께 설명드리고, 휴대폰으로 결과지를 보내 드립니다.'],
      ['한 반 인원은 몇 명인가요?', '한 반 최대 8명입니다. 정원이 차면 대기 신청을 받고 자리가 나면 순서대로 연락드립니다.'],
      ['결석하면 보강이 되나요?', '미리 연락 주시면 같은 주 다른 반 수업이나 질문 시간에 보강합니다. 영상 보강은 하지 않습니다.'],
      ['숙제는 얼마나 나오나요?', '수업 1회당 30~40분 분량입니다. 다음 수업 시작 때 선생님이 노트를 직접 확인합니다.'],
      ['학부모 상담은 어떻게 하나요?', '매달 학습 리포트를 링크로 보내 드리고, 학기마다 한 번 대면 또는 전화 상담을 합니다. 필요하시면 언제든 카톡으로 요청해 주세요.'],
    ];
    await prisma.faqItem.createMany({ data: fq.map(([question, answer], i) => ({ tenantId: T, question, answer, sortOrder: i })) });
  }

  // ── 6. 소식·후기·성과 ───────────────────────────────────────
  if ((await count('post')) === 0) {
    const posts = [
      { category: 'recruit', title: '겨울방학 특강 모집 안내 (중1~중3)', summaryFields: { period: '12/29 ~ 2/20 (8주)', target: '중1~중3', count: '반별 8명', fee: '반별 안내' }, body: `겨울방학 8주 동안 다음 학기 ${S}를 미리 준비하는 특강을 엽니다.\n\n· 주 3회, 1회 100분\n· 개념 정리 + 학교별 기출 유형\n· 방학 마지막 주 실전 모의 테스트\n\n자리가 한정되어 있어 재원생 우선으로 받고, 남는 자리는 신규 학생을 받습니다. 레벨테스트 후 반을 배정합니다.`, publishedAt: at(3, 10) },
      { category: 'exam', title: '2학기 중간고사 결과 안내', body: `2학기 중간고사가 끝났습니다. 재원생 평균이 지난 학기보다 6점 올랐습니다.\n\n시험지 분석 결과, 서술형에서 풀이 과정을 끝까지 쓰지 않아 감점된 경우가 가장 많았습니다. 기말고사까지 서술형 쓰기 연습을 매 수업 10분씩 넣겠습니다.\n\n학생별 결과는 이번 주 학습 리포트로 보내 드립니다.`, publishedAt: at(9, 18) },
      { category: 'notice', title: '추석 연휴 휴원 안내', body: '추석 연휴 기간에는 휴원합니다. 해당 주 수업은 연휴 다음 주 토요일 보강으로 진행합니다. 보강 시간은 반별로 문자 드리겠습니다.', publishedAt: at(40, 11) },
      { category: 'gallery', title: '10월 수업 모습', body: '중2 심화반 친구들이 서로 풀이를 설명하는 시간입니다. 설명하면서 스스로 부족한 부분을 찾는 연습을 하고 있어요.', publishedAt: at(14, 20) },
      { category: 'notice', title: '[작성 중] 기말고사 대비 일정', body: '기말고사 4주 전부터 토요일 특별 수업을 진행합니다. (일정 확정 후 공개 예정)', status: 'draft' },
    ];
    for (const p of posts) await prisma.post.create({ data: { tenantId: T, status: p.status ?? 'published', images: [], ...p } });
  }
  if ((await count('review')) === 0) {
    const rv = [
      { kind: 'review', body: '원장 선생님이 아이가 왜 틀렸는지 끝까지 같이 봐 주셔서, 수학을 싫어하던 아이가 질문을 하기 시작했어요. 매달 오는 리포트로 아이 상태를 알 수 있어서 좋습니다.', authorLabel: '중2 학부모', gradeBand: '중등', source: '네이버 플레이스', showOnHome: true },
      { kind: 'review', body: '한 반 인원이 적어서 선생님이 아이 노트를 매번 확인해 주세요. 숙제 습관이 확실히 잡혔습니다.', authorLabel: '중1 학부모', gradeBand: '중등', source: '학원 설문', showOnHome: true },
      { kind: 'review', body: '레벨테스트 결과를 단원별로 자세히 설명해 주셔서 믿음이 갔어요. 약한 단원부터 다시 잡아 주시는 게 보입니다.', authorLabel: '초6 학부모', gradeBand: '초등', source: '학원 설문', showOnHome: false },
      { kind: 'review', body: '시험 4주 전부터 학교 기출을 풀어 주셔서 처음으로 시험 준비가 덜 불안했다고 하네요.', authorLabel: '중3 학부모', gradeBand: '중등', source: '네이버 플레이스', showOnHome: false },
      { kind: 'score_case', authorLabel: '중2 김○○', gradeBand: '중등', beforeValue: '62점', afterValue: '91점', periodLabel: '1학기 중간 → 2학기 중간', comment: '서술형 풀이 쓰기를 6개월 꾸준히 연습했습니다.', consentFile: 'seed-sample-consent', showOnHome: true },
      { kind: 'score_case', authorLabel: '중3 이○○', gradeBand: '중등', beforeValue: '5등급', afterValue: '2등급', periodLabel: '중2 기말 → 중3 기말', comment: '개념 노트를 다시 만들고 틀린 문제를 3번씩 풀었습니다.', consentFile: 'seed-sample-consent', showOnHome: false },
    ];
    await prisma.review.createMany({ data: rv.map((r, i) => ({ tenantId: T, consentConfirmed: true, visible: true, createdAt: at(60 - i * 7), ...r })) });
  }
  if ((await count('resultStat')) === 0) {
    await prisma.resultStat.create({ data: {
      tenantId: T, termLabel: '2026년 2학기 중간고사', published: true,
      metrics: [{ label: '재원생 평균 상승', value: '6.2', unit: '점' }, { label: '90점 이상', value: '14', unit: '명' }, { label: '응시 재원생', value: '38', unit: '명' }],
      basisText: '2026년 2학기 중간고사 응시 재원생 38명 기준, 직전 시험 대비 (학원 자체 집계)',
    } });
  }

  // ── 7. 문제은행·시험지 ─────────────────────────────────────
  let test = await prisma.test.findFirst({ where: { tenantId: T } });
  let qs = await prisma.question.findMany({ where: { tenantId: T } });
  if (qs.length === 0) {
    const MATH = [
      { type: 'choice', unit: '정수와 유리수', difficulty: 2, body: '$(-3) \\times (+4) - (-6) \\div 2$ 의 값은?', choices: ['$-15$', '$-9$', '$-6$', '$9$', '$15$'], answers: ['2'], explanation: '$-12 - (-3) = -9$' },
      { type: 'choice', unit: '문자와 식', difficulty: 2, body: '$3(x-2) - 2(x+1)$ 을 간단히 하면?', choices: ['$x-8$', '$x-4$', '$x+4$', '$5x-8$', '$5x-4$'], answers: ['1'], explanation: '$3x-6-2x-2 = x-8$' },
      { type: 'short', unit: '일차방정식', difficulty: 3, body: '방정식 $2x + 5 = 3(x - 1)$ 의 해를 구하시오.', answers: ['8', 'x=8'], explanation: '$2x+5 = 3x-3$ 이므로 $x = 8$' },
      { type: 'choice', unit: '좌표평면과 그래프', difficulty: 2, body: '점 $(3, -2)$ 는 제몇 사분면 위의 점인가?', choices: ['제1사분면', '제2사분면', '제3사분면', '제4사분면', '어느 사분면에도 속하지 않는다'], answers: ['4'], explanation: '$x>0, y<0$ 이므로 제4사분면' },
      { type: 'short', unit: '정비례와 반비례', difficulty: 3, body: '$y$가 $x$에 정비례하고 $x=4$일 때 $y=12$이다. $x=-2$일 때 $y$의 값을 구하시오.', answers: ['-6'], explanation: '$y=3x$ 이므로 $-6$' },
      { type: 'choice', unit: '연립방정식', difficulty: 3, body: '연립방정식 $x+y=7$, $x-y=1$ 의 해에서 $xy$의 값은?', choices: ['$6$', '$10$', '$12$', '$14$', '$16$'], answers: ['3'], explanation: '$x=4, y=3$ 이므로 $12$' },
      { type: 'choice', unit: '일차함수', difficulty: 3, body: '일차함수 $y=2x-4$ 의 그래프의 $x$절편은?', choices: ['$-4$', '$-2$', '$2$', '$4$', '$8$'], answers: ['3'], explanation: '$0=2x-4$, $x=2$' },
      { type: 'short', unit: '일차함수', difficulty: 4, body: '두 점 $(1, 3)$, $(3, 7)$ 을 지나는 직선의 기울기를 구하시오.', answers: ['2'], explanation: '$(7-3)/(3-1)=2$' },
      { type: 'choice', unit: '부등식', difficulty: 4, body: '부등식 $3x - 2 > x + 6$ 을 만족하는 가장 작은 정수 $x$는?', choices: ['$3$', '$4$', '$5$', '$6$', '$7$'], answers: ['3'], explanation: '$2x>8$, $x>4$ 이므로 $5$' },
      { type: 'essay', unit: '연립방정식 활용', difficulty: 4, body: '한 개에 500원인 사탕과 한 개에 800원인 초콜릿을 합하여 10개 사고 6,200원을 냈다. 사탕과 초콜릿을 각각 몇 개 샀는지 풀이 과정과 함께 쓰시오.', answers: [], explanation: '모범답안: 사탕 $x$개, 초콜릿 $y$개 → $x+y=10$, $500x+800y=6200$ → $x=6, y=4$. 채점: 식 세우기 2점, 풀이 1점, 답 1점', points: 4 },
    ];
    const ENG = [
      { type: 'choice', unit: '동사의 시제', difficulty: 2, body: 'Choose the correct word: She ___ to school every day.', choices: ['go', 'goes', 'going', 'gone', 'went to'], answers: ['2'] },
      { type: 'choice', unit: '현재완료', difficulty: 3, body: 'I ___ in Seoul since 2020.', choices: ['live', 'lived', 'have lived', 'am living', 'will live'], answers: ['3'] },
      { type: 'short', unit: '어휘', difficulty: 2, body: "'도서관'을 뜻하는 영어 단어를 쓰시오.", answers: ['library'] },
      { type: 'choice', unit: '비교급', difficulty: 3, body: 'This box is ___ than that one.', choices: ['heavy', 'heavier', 'heaviest', 'more heavy', 'most heavy'], answers: ['2'] },
      { type: 'choice', unit: '관계대명사', difficulty: 4, body: 'The girl ___ is singing is my sister.', choices: ['who', 'which', 'what', 'whose', 'whom'], answers: ['1'] },
      { type: 'short', unit: '어휘', difficulty: 3, body: "'beautiful'의 반대말을 쓰시오.", answers: ['ugly'] },
      { type: 'choice', unit: '수동태', difficulty: 4, body: 'The window ___ by Tom yesterday.', choices: ['breaks', 'broke', 'was broken', 'is broken', 'has broken'], answers: ['3'] },
      { type: 'choice', unit: '독해', difficulty: 3, body: "Tom was tired, so he went to bed early. Why did Tom go to bed early?", choices: ['He was hungry.', 'He was tired.', 'He was sad.', 'He was late.', 'He was sick.'], answers: ['2'] },
      { type: 'short', unit: '문법', difficulty: 3, body: "빈칸에 알맞은 말: There ___ many books on the desk. (are/is)", answers: ['are'] },
      { type: 'essay', unit: '영작', difficulty: 4, body: '주말에 한 일을 영어 두 문장으로 쓰시오.', answers: [], explanation: '과거시제 사용 2점, 문장 구조 2점', points: 4 },
    ];
    const grade = english ? '중2' : '중2';
    for (const q of english ? ENG : MATH) {
      await prisma.question.create({ data: { tenantId: T, subject: S, grade, points: q.points ?? (q.difficulty >= 4 ? 3 : 2), choices: q.choices ?? undefined, explanation: q.explanation ?? null, type: q.type, unit: q.unit, difficulty: q.difficulty, body: q.body, answers: q.answers } });
    }
    qs = await prisma.question.findMany({ where: { tenantId: T }, orderBy: { createdAt: 'asc' } });
  }
  if (!test && qs.length) {
    test = await prisma.test.create({ data: {
      tenantId: T, title: `중2 ${S} 입학 레벨테스트`, grade: '중2', timeLimitMin: 40,
      description: '총 10문항, 40분입니다. 계산은 연습장에 하고, 서술형은 풀이 사진을 올려 주세요.',
      items: { create: qs.map((q, i) => ({ questionId: q.id, sortOrder: i, points: q.points })) },
    } });
  }
  const items = test ? await prisma.testItem.findMany({ where: { testId: test.id }, include: { question: true }, orderBy: { sortOrder: 'asc' } }) : [];

  // ── 8. 상담(리드)·상담 이력·동의·응시 ────────────────────────
  const LEADS = [
    // [학부모, 학년, 학교, 상담유형, 상태, 며칠 전, 메모, 마케팅 동의, 유입]
    ['김민지', '중2', '○○중', 'level_test', 'enrolled', 52, '학교 시험 서술형 감점이 많다고 함', true, 'naver'],
    ['이수진', '중1', '○○중', 'level_test', 'enrolled', 45, '첫 학원. 숙제 습관 걱정', true, 'instagram'],
    ['박지영', '중2', '△△중', 'phone', 'enrolled', 38, '형이 다니던 학원이라 문의', false, 'referral'],
    ['최은희', '초6', '○○초', 'level_test', 'enrolled', 19, '예비중 과정 문의', true, 'naver'],
    ['정혜원', '중3', '○○중', 'visit', 'enrolled', 12, '고1 선행 희망', false, 'naver'],
    ['강미영', '중2', '△△중', 'level_test', 'not_enrolled', 22, '시간이 맞지 않음', false, 'naver'],
    ['조현정', '중1', '○○중', 'level_test', 'test_done', 9, '결과 보고 다음 주 결정 예정', true, 'kakao'],
    ['윤서영', '중2', '○○중', 'level_test', 'test_booked', 5, '이번 주 토요일 테스트', false, 'naver'],
    ['장은주', '초6', '□□초', 'phone', 'contacted', 3, '셔틀 노선 문의', false, 'blog'],
    ['임지혜', '중3', '△△중', 'waitlist', 'new', 1, '중2 심화반 대기 신청', false, 'naver'],
    ['한소영', '중1', '○○중', 'level_test', 'new', 0, '', true, 'instagram'],
    ['오정민', '중2', '○○중', 'level_test', 'no_show', 15, '연락 두 번 부재', false, 'naver'],
  ];
  const leadByName = {};
  if ((await count('lead')) === 0) {
    for (const [i, [parentName, studentGrade, school, consultType, status, ago, message, marketing, source]] of LEADS.entries()) {
      const createdAt = at(ago, 10 + (i % 8), (i * 7) % 60);
      const changed = at(Math.max(0, ago - 2), 18);
      const lead = await prisma.lead.create({ data: {
        tenantId: T, parentName, phone: phone(1001 + i), studentGrade, school, consultType, status, createdAt,
        statusChangedAt: status === 'new' ? createdAt : changed, message: message || null, source, utm: { source, medium: source === 'naver' ? 'organic' : 'social' },
        notEnrolledReason: status === 'not_enrolled' ? '시간' : null,
        testAt: status === 'test_booked' ? at(-3, 11) : null, // slot 없이 — 전날 알림 대상 아님
      } });
      leadByName[parentName] = lead;
      const ev = [{ leadId: lead.id, type: 'created', createdAt, payload: { consultType } }];
      if (status !== 'new') ev.push({ leadId: lead.id, type: 'call', createdAt: at(Math.max(0, ago - 1), 16), payload: { note: '첫 통화 — 아이 상황·희망 시간 확인' } });
      if (status !== 'new' && status !== 'contacted') ev.push({ leadId: lead.id, type: 'status_changed', createdAt: changed, payload: { from: 'contacted', to: status } });
      await prisma.leadEvent.createMany({ data: ev });
      await prisma.consent.create({ data: { tenantId: T, leadId: lead.id, type: 'privacy', grantedAt: createdAt, channel: 'web' } });
      // 미등록 상담은 마케팅 동의 없이 — 후속 메시지 자동 발송 대상이 되지 않게
      if (marketing && status !== 'not_enrolled') await prisma.consent.create({ data: { tenantId: T, leadId: lead.id, type: 'marketing', grantedAt: createdAt, channel: 'web' } });
      // 접수 안내 발송 기록 (이미 보낸 것으로만 — 대기 중인 발송은 만들지 않는다)
      await prisma.message.create({ data: { tenantId: T, leadId: lead.id, scenario: 'receipt', kind: 'info', channel: 'alimtalk', recipientHash: hashPhone(phone(1001 + i)), status: 'sent', sentAt: new Date(createdAt.getTime() + 60000), cost: 9, createdAt } });
    }
  } else {
    for (const l of await prisma.lead.findMany({ where: { tenantId: T } })) leadByName[l.parentName] = l;
  }

  // 레벨테스트 응시 (제출·채점 완료)
  const ATTEMPTS = [['김민지', 0.72, 50], ['이수진', 0.58, 43], ['최은희', 0.83, 17], ['강미영', 0.66, 20], ['조현정', 0.9, 8]];
  if (test && items.length && (await prisma.testAttempt.count({ where: { tenantId: T } })) === 0) {
    for (const [name, skill, ago] of ATTEMPTS) {
      const lead = leadByName[name];
      if (!lead) continue;
      let score = 0;
      const max = items.reduce((t, it) => t + it.points, 0);
      const responses = items.map((it) => {
        const q = it.question;
        const ok = rand() < skill + (3 - q.difficulty) * 0.08;
        if (q.type === 'essay') {
          const pts = ok ? it.points : Math.max(1, Math.round(it.points * 0.5));
          score += pts;
          return { questionId: q.id, answer: english ? 'I went to the park. I played soccer.' : '사탕 x개, 초콜릿 y개로 놓으면 x+y=10, 500x+800y=6200 ...', correct: pts === it.points, points: pts, feedback: ok ? '식 세우기와 풀이 과정이 깔끔합니다.' : '식은 잘 세웠는데 계산 과정에서 실수가 있었어요. 마지막 검산을 꼭 해 봅시다.', errorType: ok ? null : 'calculation', gradedBy: ownerEmail };
        }
        if (ok) score += it.points;
        const answer = q.type === 'choice' ? (ok ? q.answers[0] : String(((Number(q.answers[0]) % 5) + 1))) : ok ? q.answers[0] : '7';
        return { questionId: q.id, answer, correct: ok, points: ok ? it.points : 0 };
      });
      const started = at(ago, 15, 0);
      await prisma.testAttempt.create({ data: {
        tenantId: T, testId: test.id, leadId: lead.id, token: token(), status: 'submitted', startedAt: started, submittedAt: new Date(started.getTime() + 34 * 60000),
        score, maxScore: max, needsGrading: false, gradedAt: new Date(started.getTime() + 3 * 3600000), issuedBy: ownerEmail, createdAt: new Date(started.getTime() - 3600000),
        responses: { create: responses.map((r) => ({ ...r, tenantId: T })) },
      } });
    }
  }

  // ── 9. 학생부·성적·메모·출결 ────────────────────────────────
  {
    const existing = await prisma.student.findMany({ where: { tenantId: T }, select: { name: true, leadId: true } });
    const existingNames = new Set(existing.map((x) => x.name));
    const linkedLeads = new Set(existing.map((x) => x.leadId).filter(Boolean));
    const cls = (band) => classes.find((c) => c.gradeBand === band) ?? null;
    const STU = [
      // [이름, 학년, 학교, 학부모, 상담건, 실력(0~1), 태그, 요약, 등록 며칠 전]
      ['김도윤', '중2', '○○중', '김민지', '김민지', 0.78, ['꼼꼼함', '질문 많음', '시험 불안'], '개념 이해는 빠르나 시험 때 긴장해서 계산 실수가 잦음. 칭찬하면 집중력이 올라감.', 48],
      ['이서아', '중1', '○○중', '이수진', '이수진', 0.64, ['숙제 성실', '내성적'], '조용하지만 숙제는 빠짐없이 해 옴. 모르는 것을 먼저 말하지 않아 수업 중 확인 필요.', 42],
      ['박시우', '중2', '△△중', '박지영', '박지영', 0.7, ['활발함', '덤벙댐'], '이해가 빠르고 발표를 좋아함. 문제를 끝까지 읽지 않아 조건을 놓치는 경우가 많음.', 35],
      ['최하린', '초6', '○○초', '최은희', '최은희', 0.86, ['끈기 있음', '선행 필요'], '연산이 정확하고 끝까지 푸는 힘이 있음. 중1 과정 선행 가능.', 15],
      ['정민준', '중3', '○○중', '정혜원', '정혜원', 0.74, ['승부욕 강함'], '모의 테스트 순위에 관심이 많음. 서술형 쓰기 연습 중.', 9],
      ['한지호', '중2', '○○중', '한경희', null, 0.6, ['집중 짧음', '칭찬에 반응'], '수업 후반에 집중력이 떨어짐. 짧게 끊어 확인하면 잘 따라옴.', 120],
      ['서윤아', '중2', '△△중', '서미정', null, 0.88, ['꼼꼼함', '숙제 성실'], '반에서 가장 안정적. 심화 문제를 따로 내 주고 있음.', 200],
      ['윤태민', '중1', '○○중', '윤정아', null, 0.55, ['기초 부족', '숙제 미흡'], '초등 분수 계산이 약함. 주 1회 기초 보충 진행 중.', 90],
      ['장예린', '중3', '△△중', '장수경', null, 0.8, ['끈기 있음'], '고1 수학(상) 선행을 무리 없이 따라오는 중.', 260],
      ['임하준', '중1', '○○중', '임소라', null, 0.68, ['활발함'], '친구들과 풀이를 설명하는 시간에 적극적.', 75],
      ['송지안', '중1', '△△중', '송은정', null, 0.73, ['꼼꼼함', '내성적'], '노트 정리가 깔끔함. 질문을 먼저 하도록 기회를 주는 중.', 110],
      ['권도현', '중1', '○○중', '권미숙', null, 0.62, ['덤벙댐', '활발함'], '빨리 풀고 검산을 하지 않음. 검산 체크리스트를 쓰기로 함.', 64],
      ['배수아', '중1', '□□중', '배지현', null, 0.8, ['숙제 성실', '끈기 있음'], '어려운 문제도 끝까지 붙잡는 편. 심화 문제를 조금씩 늘리는 중.', 150],
      ['유건우', '중2', '○○중', '유선희', null, 0.57, ['집중 짧음', '기초 부족'], '중1 일차방정식 개념이 흔들림. 주 1회 보충 진행.', 58],
      ['문채원', '중2', '△△중', '문혜진', null, 0.84, ['승부욕 강함', '질문 많음'], '단원평가 1등을 목표로 함. 질문이 구체적이라 수업 분위기를 이끔.', 230],
      ['신유준', '중3', '○○중', '신은영', null, 0.69, ['시험 불안', '숙제 성실'], '평소 실력보다 시험 점수가 낮게 나옴. 시간 재고 푸는 연습 중.', 140],
      ['홍예서', '중3', '□□중', '홍지은', null, 0.9, ['꼼꼼함', '선행 필요'], '고1 수학(상)까지 무리 없이 따라옴. 고등 내신 서술형 대비 중.', 300],
      ['노시현', '중3', '△△중', '노미란', null, 0.63, ['칭찬에 반응', '숙제 미흡'], '숙제를 자주 빠뜨림. 학부모님과 숙제 확인 루틴을 함께 정함.', 45],
      ['안서진', '초6', '○○초', '안수연', null, 0.76, ['활발함', '질문 많음'], '예비중 과정을 즐겁게 따라옴. 문장제 읽기 연습 필요.', 80],
      ['조이안', '초6', '□□초', '조민정', null, 0.66, ['내성적', '끈기 있음'], '조용히 끝까지 푸는 편. 분수 나눗셈 보충 중.', 33],
    ];
    const SUBJECTS_SCORE = english ? ['영어'] : ['수학', '영어'];
    for (const [k, [name, grade, school, parentName, leadName, skill, traits, summary, enrolledAgo]] of STU.entries()) {
      if (existingNames.has(name)) continue;
      const found = leadName ? leadByName[leadName] : null;
      const lead = found && !linkedLeads.has(found.id) ? found : null;
      const c = cls(grade);
      const st = await prisma.student.create({ data: {
        tenantId: T, name, grade, school, classId: c?.id ?? null, status: 'active', enrolledAt: day(enrolledAgo),
        parentName, parentPhone: lead?.phone ?? phone(2001 + k), studentPhone: k % 3 === 0 ? phone(3001 + k) : null,
        traits, summary, leadId: lead?.id ?? null, createdBy: ownerEmail,
        consentAt: day(enrolledAgo), consentMethod: k % 4 === 3 ? 'electronic' : 'written',
      } });
      // 성적: 학교 내신(1학기 중간·기말, 2학기 중간) + 학원 단원평가(매달)
      const scores = [];
      const sp = (base) => Math.max(35, Math.min(100, Math.round(base * 100 + (rand() - 0.5) * 14)));
      if (grade !== '초6') {
        const exams = [['1학기 중간고사', 182], ['1학기 기말고사', 118], ['2학기 중간고사', 12]];
        for (const [label, ago] of exams) {
          if (ago > enrolledAgo + 200) continue;
          for (const sub of SUBJECTS_SCORE) {
            const growth = ago < enrolledAgo ? (enrolledAgo - ago) / 400 : 0;
            const score = sp(skill + growth - (sub === S ? 0 : -0.03));
            scores.push({ kind: 'school', examDate: day(ago), label, subject: sub, score, maxScore: 100, rankGrade: score >= 90 ? 1 : score >= 80 ? 2 : score >= 70 ? 3 : 4 });
          }
        }
      }
      for (const [m, ago] of [[0, Math.min(enrolledAgo - 7, 150)], [1, Math.min(enrolledAgo - 7, 90)], [2, Math.min(enrolledAgo - 7, 60)], [3, 32], [4, 4]]) {
        if (ago < 0 || ago > enrolledAgo) continue;
        scores.push({ kind: 'academy', examDate: day(ago), label: `${m + 1}차 단원평가`, subject: S, score: sp(skill + m * 0.02), maxScore: 100, rankGrade: null, memo: m === 4 && skill < 0.65 ? '분수 계산 실수' : null });
      }
      if (grade === '중3') scores.push({ kind: 'mock', examDate: day(20), label: '중3 전국연합 학력평가', subject: S, score: sp(skill - 0.05), maxScore: 100, rankGrade: skill > 0.78 ? 2 : 3, percentile: Math.round(skill * 100) });
      if (scores.length) await prisma.studentScore.createMany({ data: scores.map((x) => ({ ...x, tenantId: T, studentId: st.id, createdBy: ownerEmail })) });

      // 관찰 메모
      const NOTES = [
        ['attitude', `오늘 숙제 모두 해 옴. ${S} 서술형 풀이를 끝까지 쓰려고 노력함.`, 2],
        ['personality', traits.includes('시험 불안') ? '모의 테스트 전에 긴장을 많이 함. 시작 전에 쉬운 문제 하나로 워밍업하면 좋아짐.' : '질문을 받으면 생각을 정리해서 말하는 편. 발표 기회를 더 주기로.', 11],
        ['consult', '2학기 중간고사 결과 상담. 계산 실수 줄이기를 다음 목표로 정함.', 10],
        ['parent', '어머님과 통화 — 집에서도 숙제를 스스로 하기 시작했다고 하심.', 18],
      ];
      const n = 1 + (k % 4);
      await prisma.studentNote.createMany({ data: NOTES.slice(0, n).map(([kind, body, ago]) => ({ tenantId: T, studentId: st.id, kind, body, authorEmail: ownerEmail, authorName: ownerName, createdAt: at(ago + (k * 3) % 9, 21) })) });

      // 최근 6주 출결 (반 수업 요일만)
      if (c) {
        const att = [];
        for (let ago = 41; ago >= 0; ago--) {
          const d = day(ago);
          if (!c.days.includes(WEEKDAY[d.getUTCDay()]) || ago > enrolledAgo) continue;
          const r = rand();
          const status = r < 0.86 ? 'present' : r < 0.93 ? 'late' : r < 0.97 ? 'absent' : 'excused';
          att.push({ tenantId: T, studentId: st.id, date: d, status, note: status === 'late' ? pick(['버스 지연', '학교 행사']) : status === 'absent' ? '병결' : status === 'excused' ? '가족 행사' : null, checkedBy: ownerEmail });
        }
        if (att.length) await prisma.attendance.createMany({ data: att, skipDuplicates: true });
      }

      // 첫 학생에게는 지난달 학부모 리포트 1건
      if (k === 0) {
        const start = day(35), end = day(5);
        const scs = await prisma.studentScore.findMany({ where: { studentId: st.id, examDate: { gte: start, lte: end } }, orderBy: { examDate: 'asc' } });
        const ats = await prisma.attendance.findMany({ where: { studentId: st.id, date: { gte: start, lte: end } } });
        const counts = { present: 0, late: 0, absent: 0, excused: 0 };
        for (const a of ats) counts[a.status]++;
        const comment = `${name.slice(1)}는 이번 달 ${S} 서술형에서 풀이 과정을 끝까지 쓰는 습관이 생겼습니다. 2학기 중간고사에서도 서술형 감점이 크게 줄었어요.\n다음 달에는 시험 때 긴장해서 생기는 계산 실수를 줄이는 데 집중하겠습니다. 집에서도 많이 칭찬해 주세요.`;
        await prisma.studentReport.create({ data: {
          tenantId: T, studentId: st.id, token: token(), periodStart: start, periodEnd: end, comment, createdBy: ownerEmail,
          expiresAt: new Date(NOW.getTime() + 25 * 86400000), viewCount: 3, lastViewedAt: at(2, 21), createdAt: at(5, 20),
          snapshot: {
            v: 1,
            academy: { name: tenant.name, slug: tenant.slug, phone: tenant.phone, kakaoChannelUrl: tenant.kakaoChannelUrl },
            student: { name, grade, className: c?.name ?? null },
            period: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
            scores: scs.map((s) => ({ examDate: s.examDate.toISOString().slice(0, 10), kind: s.kind, label: s.label, subject: s.subject, score: s.score, maxScore: s.maxScore, rankGrade: s.rankGrade })),
            attendance: { total: ats.length, counts, rate: ats.length ? Math.round(((counts.present + counts.late) / ats.length) * 100) : null },
            comment,
          },
        } });
      }
    }
  }

  await prisma.platformSetting.create({ data: { key: MARKER, value: NOW.toISOString() } });
  console.log('[seed-test2] 샘플 데이터 채움 완료');
}

main()
  .catch((e) => console.error('[seed-test2] 실패 (빌드는 계속):', e instanceof Error ? e.message : e))
  .finally(() => prisma.$disconnect());
