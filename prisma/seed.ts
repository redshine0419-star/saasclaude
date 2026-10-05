import { PrismaClient, Theme } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// Section keys must match SECTION_ORDERS in app/[slug]/page.tsx
const WARM_SECTIONS = ['hero', 'quick_info', 'director', 'classes', 'fees', 'reviews', 'news', 'consult_form'];
const RESULT_SECTIONS = ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'consult_form'];
const BRIGHT_SECTIONS = ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'consult_form'];

async function upsertSections(tenantId: string, keys: string[]) {
  for (let i = 0; i < keys.length; i++) {
    await prisma.tenantSection.upsert({
      where: { tenantId_sectionKey: { tenantId, sectionKey: keys[i] } },
      update: { sortOrder: i, enabled: true },
      create: { tenantId, sectionKey: keys[i], sortOrder: i, enabled: true },
    });
  }
}

async function main() {
  // ─── Demo A: warm theme ──────────────────────────────────────────
  const tenantA = await prisma.tenant.upsert({
    where: { slug: 'demo-warm' },
    update: {},
    create: {
      slug: 'demo-warm',
      name: '하늘수학학원',
      theme: Theme.warm,
      subjects: '수학',
      targetGrades: '초등~고등',
      address: '서울시 노원구 상계로 123',
      phone: '02-1234-5678',
      hours: '평일 14:00~22:00 / 토 10:00~18:00',
      kakaoChannelUrl: 'https://pf.kakao.com/_demo',
      regNo: '제2024-서울노원-0001호',
      status: 'active',
      planStatus: 'beta',
      betaStartedAt: new Date(),
    },
  });
  await upsertSections(tenantA.id, WARM_SECTIONS);
  await prisma.directorProfile.upsert({
    where: { tenantId: tenantA.id },
    update: {},
    create: {
      tenantId: tenantA.id,
      headline: '18년 현장 경험, 원장이 직접 가르칩니다',
      philosophy: '틀린 문제를 함께 분석하는 것이 실력의 시작입니다.',
      education: 'OO대학교 수학교육과',
      career: '수학 전문 강사 18년',
    },
  });
  await prisma.classItem.upsert({
    where: { id: 'demo-warm-class-1' },
    update: {},
    create: {
      id: 'demo-warm-class-1',
      tenantId: tenantA.id,
      name: '중등 수학 기본반',
      gradeBand: '중1~중3',
      days: ['월', '수', '금'],
      startTime: '16:00',
      endTime: '18:00',
      capacity: 8,
      seatsLeft: 3,
      sortOrder: 0,
    },
  });
  await prisma.classItem.upsert({
    where: { id: 'demo-warm-class-2' },
    update: {},
    create: {
      id: 'demo-warm-class-2',
      tenantId: tenantA.id,
      name: '고등 수학 심화반',
      gradeBand: '고1~고3',
      days: ['화', '목'],
      startTime: '19:00',
      endTime: '21:30',
      capacity: 6,
      seatsLeft: 1,
      sortOrder: 1,
    },
  });
  await prisma.fee.upsert({
    where: { id: 'demo-warm-fee-1' },
    update: {},
    create: {
      id: 'demo-warm-fee-1',
      tenantId: tenantA.id,
      label: '중등 기본반',
      sessionsPerWeek: 3,
      monthlyHours: 24,
      amount: 280000,
    },
  });
  await prisma.fee.upsert({
    where: { id: 'demo-warm-fee-2' },
    update: {},
    create: {
      id: 'demo-warm-fee-2',
      tenantId: tenantA.id,
      label: '고등 심화반',
      sessionsPerWeek: 2,
      monthlyHours: 20,
      amount: 320000,
    },
  });

  // ─── Demo B: result theme ─────────────────────────────────────────
  const tenantB = await prisma.tenant.upsert({
    where: { slug: 'demo-result' },
    update: {},
    create: {
      slug: 'demo-result',
      name: '최상위수학학원',
      theme: Theme.result,
      subjects: '수학',
      targetGrades: '중등~고등',
      address: '서울시 강남구 테헤란로 456',
      phone: '02-9876-5432',
      hours: '평일 15:00~22:00',
      kakaoChannelUrl: 'https://pf.kakao.com/_demo-result',
      regNo: '제2024-서울강남-0002호',
      status: 'active',
      planStatus: 'beta',
      betaStartedAt: new Date(),
    },
  });
  await upsertSections(tenantB.id, RESULT_SECTIONS);
  await prisma.resultStat.upsert({
    where: { id: 'demo-result-stat-1' },
    update: {},
    create: {
      id: 'demo-result-stat-1',
      tenantId: tenantB.id,
      termLabel: '2024년 2학기',
      metrics: [
        { label: '수강생 수', value: '42', unit: '명' },
        { label: '1등급 배출', value: '18', unit: '명' },
        { label: '평균 성적 상승', value: '23.4', unit: '점' },
      ],
      basisText: '재원생 중 동일 과목 직전 시험 대비 성적 변화 기준',
      published: true,
    },
  });
  await prisma.staffProfile.upsert({
    where: { id: 'demo-result-staff-1' },
    update: {},
    create: {
      id: 'demo-result-staff-1',
      tenantId: tenantB.id,
      name: '김수학 강사',
      roleLabel: '수학 전문',
      summary: 'OO대 수학과 졸업 · 현장 강의 12년',
      sortOrder: 0,
    },
  });

  // ─── Demo C: bright theme ─────────────────────────────────────────
  const tenantC = await prisma.tenant.upsert({
    where: { slug: 'demo-bright' },
    update: {},
    create: {
      slug: 'demo-bright',
      name: '해피영어학원',
      theme: Theme.bright,
      subjects: '영어',
      targetGrades: '유아~초등',
      address: '서울시 마포구 월드컵로 789',
      phone: '02-1111-2222',
      hours: '평일 10:00~20:00',
      kakaoChannelUrl: 'https://pf.kakao.com/_demo-bright',
      regNo: '제2024-서울마포-0003호',
      status: 'active',
      planStatus: 'beta',
      betaStartedAt: new Date(),
    },
  });
  await upsertSections(tenantC.id, BRIGHT_SECTIONS);
  await prisma.classItem.upsert({
    where: { id: 'demo-bright-class-1' },
    update: {},
    create: {
      id: 'demo-bright-class-1',
      tenantId: tenantC.id,
      name: '유아 파닉스반',
      gradeBand: '6~7세',
      days: ['월', '수', '금'],
      startTime: '10:00',
      endTime: '11:00',
      capacity: 8,
      seatsLeft: 4,
      sortOrder: 0,
    },
  });
  await prisma.classItem.upsert({
    where: { id: 'demo-bright-class-2' },
    update: {},
    create: {
      id: 'demo-bright-class-2',
      tenantId: tenantC.id,
      name: '초등 회화반',
      gradeBand: '초1~초3',
      days: ['화', '목'],
      startTime: '15:00',
      endTime: '16:30',
      capacity: 10,
      seatsLeft: 2,
      sortOrder: 1,
    },
  });

  // ─── Level test slots for all demos ──────────────────────────────
  for (const tenant of [tenantA, tenantB, tenantC]) {
    for (const weekday of [6, 7]) { // 토(6), 일(7) → 0=Sun so 6=Sat, 0=Sun
      const wd = weekday === 7 ? 0 : weekday;
      await prisma.levelTestSlot.upsert({
        where: { id: `${tenant.slug}-slot-${wd}` },
        update: {},
        create: {
          id: `${tenant.slug}-slot-${wd}`,
          tenantId: tenant.id,
          weekday: wd,
          time: '10:00',
          active: true,
        },
      });
    }
  }

  // ─── Demo reviews ────────────────────────────────────────────────
  await prisma.review.upsert({
    where: { id: 'demo-warm-review-1' },
    update: {},
    create: {
      id: 'demo-warm-review-1',
      tenantId: tenantA.id,
      kind: 'review',
      body: '원장 선생님이 직접 가르쳐 주셔서 아이가 수학에 자신감이 생겼어요.',
      authorLabel: '중2 학부모',
      consentConfirmed: true,
      showOnHome: true,
      visible: true,
    },
  });
  await prisma.review.upsert({
    where: { id: 'demo-result-review-1' },
    update: {},
    create: {
      id: 'demo-result-review-1',
      tenantId: tenantB.id,
      kind: 'score_case',
      body: '입학 시 4등급에서 6개월 만에 1등급으로 올랐습니다.',
      authorLabel: '고2 학생',
      beforeValue: '4등급',
      afterValue: '1등급',
      periodLabel: '6개월',
      consentConfirmed: true,
      consentFile: 'demo-consent.pdf',
      showOnHome: true,
      visible: true,
    },
  });

  console.log('Seed complete:', tenantA.slug, tenantB.slug, tenantC.slug);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
