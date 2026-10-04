import { prisma } from '@/lib/prisma';

export type AcademyTenant = {
  slug: string;
  name: string;
  theme: string;
  accentColor: string | null;
  subjects: string | null;
  targetGrades: string | null;
  address: string | null;
  phone: string | null;
  hours: string | null;
  kakaoChannelUrl: string | null;
  naverPlaceUrl: string | null;
  regNo: string | null;
};

export type AcademyDirector = {
  photo: string | null;
  headline: string | null;
  philosophy: string | null;
  education: string | null;
  career: string | null;
  subjectsTaught: string | null;
} | null;

export type AcademyClass = {
  id: string;
  name: string;
  gradeBand: string | null;
  days: string[];
  startTime: string | null;
  endTime: string | null;
  textbook: string | null;
  description: string | null;
  seatsLeft: number | null;
  capacity: number | null;
  waitlistCount: number;
  sortOrder: number;
};

export type AcademyFee = {
  id: string;
  classId: string | null;
  label: string;
  sessionsPerWeek: number | null;
  monthlyHours: number | null;
  amount: number;
  note: string | null;
};

export type AcademyReview = {
  id: string;
  kind: string;
  body: string | null;
  authorLabel: string | null;
  source: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  periodLabel: string | null;
  comment: string | null;
};

export type AcademyPost = {
  id: string;
  category: string;
  title: string;
  publishedAt: Date | string | null;
};

export type LevelTestSlot = {
  id: string;
  weekday: number | null;
  time: string | null;
};

export type AcademyPageData = {
  tenant: AcademyTenant;
  sections: string[];
  director: AcademyDirector;
  classes: AcademyClass[];
  fees: AcademyFee[];
  extraCosts: { id: string; label: string; amount: number; note: string | null }[];
  reviews: AcademyReview[];
  posts: AcademyPost[];
  levelTestSlots: LevelTestSlot[];
};

// ─── 데모 데이터 (warm theme) ────────────────────────────────
export const DEMO_DATA: AcademyPageData = {
  tenant: {
    slug: 'demo',
    name: '한빛수학학원',
    theme: 'warm',
    accentColor: null,
    subjects: '수학',
    targetGrades: '중1 ~ 고2',
    address: '서울시 노원구 상계로 123, 상계빌딩 3층',
    phone: '02-1234-5678',
    hours: '평일 14:00~22:00 / 토 10:00~18:00',
    kakaoChannelUrl: '#',
    naverPlaceUrl: '#',
    regNo: '1234-노원-2024',
  },
  sections: ['hero', 'quick_info', 'director', 'classes', 'fees', 'reviews', 'news', 'consult_form'],
  director: {
    photo: null,
    headline: '"아이가 왜 틀렸는지 알 때까지\n같이 봅니다."',
    philosophy: '수학 실력은 한 문제 한 문제 직접 짚어주는 데서 나옵니다. 저는 매 수업 아이가 막힌 이유를 찾을 때까지 넘어가지 않습니다.',
    education: 'OO대학교 수학교육과',
    career: 'OO학원 강사 5년, 현 한빛수학학원 운영 8년',
    subjectsTaught: '중3 · 고1 · 고2 전 과정 직강',
  },
  classes: [
    { id: 'c1', name: '중1 기본반', gradeBand: '중등', days: ['월', '수', '금'], startTime: '17:00', endTime: '18:40', textbook: '중학수학 1-1', description: '개념부터 탄탄히, 연산 오류 잡기 집중', seatsLeft: 2, capacity: 8, waitlistCount: 0, sortOrder: 0 },
    { id: 'c2', name: '중2 내신반', gradeBand: '중등', days: ['화', '목'], startTime: '18:00', endTime: '20:30', textbook: '학교별 기출문제집', description: '시험 4주 전부터 학교별 기출 대비', seatsLeft: 0, capacity: 8, waitlistCount: 3, sortOrder: 1 },
    { id: 'c3', name: '중3 선행반', gradeBand: '중등', days: ['월', '수', '금'], startTime: '19:00', endTime: '21:00', textbook: '고1 공통수학 교재', description: '고1 공통수학 선행, 중3 2학기 동시 진행', seatsLeft: 4, capacity: 8, waitlistCount: 0, sortOrder: 2 },
    { id: 'c4', name: '고1 공통반', gradeBand: '고등', days: ['화', '목'], startTime: '18:00', endTime: '20:30', textbook: '수학(상·하)', description: '공통수학 전범위 + 학교 내신 대비', seatsLeft: 3, capacity: 8, waitlistCount: 0, sortOrder: 3 },
    { id: 'c5', name: '고2 수학1·2', gradeBand: '고등', days: ['월', '수', '금'], startTime: '19:30', endTime: '22:00', textbook: '수학I / 수학II', description: '수능·내신 병행, 개념+기출 분석', seatsLeft: 0, capacity: 8, waitlistCount: 5, sortOrder: 4 },
  ],
  fees: [
    { id: 'f1', classId: null, label: '중등 기본반', sessionsPerWeek: 3, monthlyHours: 24, amount: 320000, note: '교재비 별도' },
    { id: 'f2', classId: null, label: '중등 내신반', sessionsPerWeek: 2, monthlyHours: 20, amount: 280000, note: '교재비 별도' },
    { id: 'f3', classId: null, label: '고등반', sessionsPerWeek: 3, monthlyHours: 30, amount: 420000, note: '교재비 별도' },
  ],
  extraCosts: [
    { id: 'e1', label: '교재비', amount: 15000, note: '월 평균' },
  ],
  reviews: [
    { id: 'r1', kind: 'review', body: '원장 선생님이 직접 모르는 부분을 끝까지 봐주셔서 아이가 수학에 자신감이 생겼어요. 1년 만에 성적이 많이 올랐습니다.', authorLabel: '중2 학부모', source: '네이버 플레이스', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
    { id: 'r2', kind: 'review', body: '정원이 8명이라 한 명 한 명 세심하게 챙겨주세요. 아이도 학원 가는 걸 좋아합니다.', authorLabel: '고1 학부모', source: '카카오톡 채널', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
    { id: 'r3', kind: 'score_case', body: null, authorLabel: null, source: null, beforeValue: '62점', afterValue: '88점', periodLabel: '중2 1학기 → 2학기', comment: '6개월 집중 내신 대비 결과. 학생·학부모 동의하에 게재.' },
  ],
  posts: [
    { id: 'p1', category: 'recruit', title: '2026 겨울방학 특강 모집 안내', publishedAt: new Date('2026-09-25') },
    { id: 'p2', category: 'notice', title: '추석 연휴 휴강 안내 (10.3~10.5)', publishedAt: new Date('2026-09-18') },
    { id: 'p3', category: 'notice', title: '2학기 중간고사 대비 일정 공지', publishedAt: new Date('2026-09-10') },
  ],
  levelTestSlots: [
    { id: 's1', weekday: 2, time: '18:00' },
    { id: 's2', weekday: 4, time: '17:00' },
    { id: 's3', weekday: 6, time: '11:00' },
  ],
};

// ─── 요일 숫자 → 한글 ────────────────────────────────────────
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export function weekdayLabel(n: number): string {
  return WEEKDAYS[n] ?? '';
}

// ─── DB 조회 ──────────────────────────────────────────────────
export async function getAcademyPageData(slug: string): Promise<AcademyPageData | null> {
  if (slug === 'demo') return DEMO_DATA;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug, status: 'active' },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
        directorProfile: true,
        classes: { orderBy: { sortOrder: 'asc' } },
        fees: true,
        extraCosts: true,
        reviews: { where: { visible: true, showOnHome: true } },
        posts: {
          where: { status: 'published' },
          orderBy: { publishedAt: 'desc' },
          take: 5,
        },
        levelTestSlots: { where: { active: true } },
      },
    });
    if (!tenant) return null;

    const enabledSections = tenant.sections
      .filter((s) => s.enabled)
      .map((s) => s.sectionKey);

    return {
      tenant: {
        slug: tenant.slug,
        name: tenant.name,
        theme: tenant.theme,
        accentColor: tenant.accentColor,
        subjects: tenant.subjects,
        targetGrades: tenant.targetGrades,
        address: tenant.address,
        phone: tenant.phone,
        hours: tenant.hours,
        kakaoChannelUrl: tenant.kakaoChannelUrl,
        naverPlaceUrl: tenant.naverPlaceUrl,
        regNo: tenant.regNo,
      },
      sections: enabledSections,
      director: tenant.directorProfile ?? null,
      classes: tenant.classes.map((c) => ({
        id: c.id,
        name: c.name,
        gradeBand: c.gradeBand,
        days: c.days,
        startTime: c.startTime,
        endTime: c.endTime,
        textbook: c.textbook,
        description: c.description,
        seatsLeft: c.seatsLeft,
        capacity: c.capacity,
        waitlistCount: c.waitlistCount,
        sortOrder: c.sortOrder,
      })),
      fees: tenant.fees.map((f) => ({
        id: f.id,
        classId: f.classId,
        label: f.label,
        sessionsPerWeek: f.sessionsPerWeek,
        monthlyHours: f.monthlyHours,
        amount: f.amount,
        note: f.note,
      })),
      extraCosts: tenant.extraCosts,
      reviews: tenant.reviews.map((r) => ({
        id: r.id,
        kind: r.kind,
        body: r.body,
        authorLabel: r.authorLabel,
        source: r.source,
        beforeValue: r.beforeValue,
        afterValue: r.afterValue,
        periodLabel: r.periodLabel,
        comment: r.comment,
      })),
      posts: tenant.posts.map((p) => ({
        id: p.id,
        category: p.category,
        title: p.title,
        publishedAt: p.publishedAt,
      })),
      levelTestSlots: tenant.levelTestSlots.map((s) => ({
        id: s.id,
        weekday: s.weekday,
        time: s.time,
      })),
    };
  } catch {
    return null;
  }
}
