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
  naverMapEmbedUrl: string | null;
  regNo: string | null;
  locationHeadline: string | null;
  transitInfo: string | null;
  parkingInfo: string | null;
};

export type AcademyDirector = {
  photo: string | null;
  headline: string | null;
  philosophy: string | null;
  education: string | null;
  career: string | null;
  subjectsTaught: string | null;
  name: string | null;
} | null;

export type AcademyPrinciple = {
  id: string;
  number: string;
  title: string;
  description: string | null;
};

export type AcademyFacility = {
  id: string;
  label: string;
  photo: string | null;
};

export type AcademyShuttleStop = {
  id: string;
  stop: string;
  pickup: string | null;
  dropoff: string | null;
};

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
  gradeBand: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  periodLabel: string | null;
  comment: string | null;
};

export type AcademyPost = {
  id: string;
  category: string;
  title: string;
  summary: string | null;
  body: string | null;
  imageUrl: string | null;
  summaryFields: Record<string, string> | null;
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
  principles: AcademyPrinciple[];
  facilities: AcademyFacility[];
  classes: AcademyClass[];
  fees: AcademyFee[];
  extraCosts: { id: string; label: string; amount: number; note: string | null }[];
  refundPolicyText: string | null;
  reviews: AcademyReview[];
  posts: AcademyPost[];
  shuttle: AcademyShuttleStop[];
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
    naverMapEmbedUrl: null,
    regNo: '1234-노원-2024',
    locationHeadline: '상계역 3번 출구에서 걸어서 5분',
    transitInfo: '**지하철** 4호선 상계역 3번 출구, 도보 5분\n**버스** 상계주공 5단지 하차 · 1161, 1167번\n**주차** 건물 지하 주차장 · 상담 시 1시간 무료',
    parkingInfo: null,
  },
  sections: ['hero', 'quick_info', 'director', 'classes', 'fees', 'reviews', 'news', 'consult_form'],
  director: {
    photo: null,
    name: '김한빛',
    headline: '"아이가 왜 틀렸는지 알 때까지\n같이 봅니다."',
    philosophy: '수학 실력은 한 문제 한 문제 직접 짚어주는 데서 나옵니다. 저는 매 수업 아이가 막힌 이유를 찾을 때까지 넘어가지 않습니다. 작은 학원이라 가능한 밀착 지도, 그게 한빛수학이 8년째 같은 자리를 지키는 이유입니다.',
    education: 'OO대학교 수학교육과',
    career: 'OO학원 강사 5년, 현 한빛수학학원 운영 8년',
    subjectsTaught: '중3 · 고1 · 고2 전 과정 직강',
  },
  principles: [
    { id: 'pr1', number: '01', title: '한 반 최대 8명', description: '이 인원이면 수업 중 한 명 한 명에게 질문을 드릴 수 있습니다. 모르는 채로 넘어가는 아이가 없도록, 정원을 더 늘리지 않습니다.' },
    { id: 'pr2', number: '02', title: '매 수업 확인 테스트', description: '지난 수업 내용을 매번 10분 테스트로 확인합니다. 틀린 문제는 그 자리에서 원인을 찾고 다시 풀 때까지 넘어가지 않습니다.' },
    { id: 'pr3', number: '03', title: '월 1회 학부모 상담', description: '아이의 진도, 틀리는 유형, 다음 달 학습 방향을 매달 직접 알려드립니다. 카톡이나 전화로도 언제든 연락 주세요.' },
  ],
  facilities: [
    { id: 'fa1', label: '강의실 2개', photo: null },
    { id: 'fa2', label: '자습실 10석', photo: null },
    { id: 'fa3', label: '상담실', photo: null },
  ],
  classes: [
    { id: 'c1', name: '중1 기본반', gradeBand: '중등', days: ['월', '수', '금'], startTime: '17:00', endTime: '18:40', textbook: '중학수학 1-1', description: '개념부터 탄탄히, 연산 오류 잡기 집중', seatsLeft: 2, capacity: 8, waitlistCount: 0, sortOrder: 0 },
    { id: 'c2', name: '중2 내신반', gradeBand: '중등', days: ['화', '목'], startTime: '18:00', endTime: '20:30', textbook: '학교별 기출문제집', description: '시험 4주 전부터 학교별 기출 대비', seatsLeft: 0, capacity: 8, waitlistCount: 3, sortOrder: 1 },
    { id: 'c3', name: '중3 선행반', gradeBand: '중등', days: ['월', '수', '금'], startTime: '19:00', endTime: '21:00', textbook: '고1 공통수학 교재', description: '고1 공통수학 선행, 중3 2학기 동시 진행', seatsLeft: 4, capacity: 8, waitlistCount: 0, sortOrder: 2 },
    { id: 'c4', name: '고1 공통반', gradeBand: '고등', days: ['화', '목'], startTime: '18:00', endTime: '20:30', textbook: '수학(상·하)', description: '공통수학 전범위 + 학교 내신 대비', seatsLeft: 3, capacity: 8, waitlistCount: 0, sortOrder: 3 },
    { id: 'c5', name: '고2 수학1·2', gradeBand: '고등', days: ['월', '수', '금'], startTime: '19:30', endTime: '22:00', textbook: '수학I / 수학II', description: '수능·내신 병행, 개념+기출 분석', seatsLeft: 0, capacity: 8, waitlistCount: 5, sortOrder: 4 },
  ],
  fees: [
    { id: 'f1', classId: 'c1', label: '중1 기본반', sessionsPerWeek: 3, monthlyHours: 24, amount: 320000, note: '교재비 별도' },
    { id: 'f2', classId: 'c2', label: '중2 내신반', sessionsPerWeek: 2, monthlyHours: 20, amount: 280000, note: '교재비 별도' },
    { id: 'f3', classId: 'c3', label: '중3 선행반', sessionsPerWeek: 3, monthlyHours: 24, amount: 340000, note: '교재비 별도' },
    { id: 'f4', classId: 'c4', label: '고1 공통반', sessionsPerWeek: 2, monthlyHours: 20, amount: 380000, note: '교재비 별도' },
    { id: 'f5', classId: 'c5', label: '고2 수학1·2', sessionsPerWeek: 3, monthlyHours: 30, amount: 420000, note: '교재비 별도' },
  ],
  extraCosts: [
    { id: 'e1', label: '교재비', amount: 15000, note: '실비 · 권당 약 15,000원' },
    { id: 'e2', label: '레벨테스트', amount: 0, note: '무료' },
  ],
  refundPolicyText: '수업 시작 전: 이미 낸 교습비 전액\n총 교습시간 1/3 지나기 전: 2/3 환불\n총 교습시간 1/2 지나기 전: 1/2 환불\n총 교습시간 1/2 지난 후: 환불 없음',
  reviews: [
    { id: 'r1', kind: 'review', body: '원장 선생님이 직접 모르는 부분을 끝까지 봐주셔서 아이가 수학에 자신감이 생겼어요. 1년 만에 성적이 많이 올랐습니다.', authorLabel: '중2 학부모', gradeBand: '중등', source: '네이버 플레이스', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
    { id: 'r2', kind: 'review', body: '정원이 8명이라 한 명 한 명 세심하게 챙겨주세요. 아이도 학원 가는 걸 좋아합니다.', authorLabel: '고1 학부모', gradeBand: '고등', source: '카카오톡 채널', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
    { id: 'r3', kind: 'review', body: '시험 전에 학교별 기출을 정말 꼼꼼히 정리해주세요. 덕분에 중간고사 성적이 올랐어요.', authorLabel: '중3 학부모', gradeBand: '중등', source: '네이버 플레이스', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
    { id: 'r4', kind: 'review', body: '다른 학원 다닐 때는 뭘 배우는지 몰랐는데, 여기는 매달 상담을 통해서 진도와 부족한 부분을 정확히 알 수 있어서 좋아요.', authorLabel: '중3 학부모', gradeBand: '중등', source: '네이버 플레이스', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
    { id: 'r5', kind: 'review', body: '수능 수학을 처음 시작할 때 개념이 너무 약했는데 원장 선생님이 기초부터 차근차근 잡아주셨어요.', authorLabel: '고2 학생', gradeBand: '고등', source: '직접 전달', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
    { id: 'r6', kind: 'score_case', body: null, authorLabel: '학생 A · 중2', gradeBand: '중등', source: null, beforeValue: '62점', afterValue: '88점', periodLabel: '1학기 기말 → 2학기 중간 · 등록 6개월', comment: '수업 중 틀린 유형을 매회 기록하고, 시험 전 집중적으로 반복했습니다.' },
    { id: 'r7', kind: 'score_case', body: null, authorLabel: '학생 B · 고1', gradeBand: '고등', source: null, beforeValue: '4등급', afterValue: '2등급', periodLabel: '1학기 → 2학기 · 등록 5개월', comment: '공통수학 개념 구멍을 먼저 메운 뒤, 기출 유형 분석으로 넘어갔습니다.' },
  ],
  posts: [
    {
      id: 'p1', category: 'recruit', title: '2026 겨울방학 특강 모집 안내',
      summary: '12월 29일부터 예비 중1·예비 고1 대상 특강 모집',
      body: '겨울방학을 활용해 다음 학년 수학 개념을 미리 잡아두는 특강입니다.\n\n특강의 목표는 단순 선행이 아닙니다. 새 학년 수학의 핵심 개념을 이해하고, 틀리기 쉬운 유형을 미리 경험하는 데 있습니다.\n\n신청은 레벨테스트 후 진행되며, 현재 실력에 맞는 반에 배정됩니다. 인원이 제한되어 있으니 서두르세요.',
      imageUrl: null,
      summaryFields: { 기간: '12.29 – 2.20', 대상: '예비 중1 · 예비 고1', 모집인원: '반별 8명', 교습비: '320,000원' },
      publishedAt: new Date('2026-09-25'),
    },
    {
      id: 'p2', category: 'notice', title: '추석 연휴 휴강 안내 (10.3~10.5)',
      summary: '추석 연휴 기간 10월 3일(목)~5일(토) 휴강',
      body: '추석 연휴 기간(10월 3일 목요일 ~ 10월 5일 토요일)은 휴강입니다.\n\n보충 수업은 별도 안내 없이 진행하지 않습니다. 연휴 동안 주어진 과제물을 미리 풀어두면 복귀 후 수업이 훨씬 수월합니다.',
      imageUrl: null,
      summaryFields: null,
      publishedAt: new Date('2026-09-18'),
    },
    {
      id: 'p3', category: 'exam', title: '2학기 중간고사 대비 일정 공지',
      summary: '10월 2주차 시험 대비 특별 수업 일정 안내',
      body: '2학기 중간고사 대비 일정을 안내합니다.\n\n시험 4주 전부터 학교별 기출문제를 분석합니다. 담당 선생님이 각 학교의 출제 경향을 미리 파악해 핵심 문제 유형을 정리해 드립니다.',
      imageUrl: null,
      summaryFields: null,
      publishedAt: new Date('2026-09-10'),
    },
    {
      id: 'p4', category: 'notice', title: '셔틀 노선 변경 안내',
      summary: '9월부터 상계주공5단지 추가, 일부 시간 조정',
      body: '9월 1일부터 셔틀 노선이 일부 변경됩니다. 상계주공 5단지 정문이 추가되었으며, 하원 시간이 10분 당겨집니다.',
      imageUrl: null,
      summaryFields: null,
      publishedAt: new Date('2026-09-01'),
    },
    {
      id: 'p5', category: 'recruit', title: '중1 기본반 신규 개설',
      summary: '9월 신규 중1 기본반 개설 — 잔여 3석',
      body: '9월 신규 중1 기본반을 개설합니다. 월·수·금 17:00~18:40 수업이며, 정원 8명 중 현재 3석이 남아 있습니다.',
      imageUrl: null,
      summaryFields: null,
      publishedAt: new Date('2026-08-20'),
    },
  ],
  shuttle: [
    { id: 'sh1', stop: '상계주공 5단지 정문', pickup: '16:40', dropoff: '21:10' },
    { id: 'sh2', stop: '상계주공 5단지 후문', pickup: '16:48', dropoff: '21:18' },
    { id: 'sh3', stop: '상계초등학교 앞', pickup: '16:55', dropoff: '21:25' },
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
        reviews: { where: { visible: true } },
        posts: {
          where: { status: 'published' },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        },
        levelTestSlots: { where: { active: true } },
      },
    });
    if (!tenant) return null;

    const enabledSections = tenant.sections
      .filter((s: { enabled: boolean }) => s.enabled)
      .map((s: { sectionKey: string }) => s.sectionKey);

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
        naverMapEmbedUrl: null,
        regNo: tenant.regNo,
        locationHeadline: null,
        transitInfo: null,
        parkingInfo: null,
      },
      sections: enabledSections,
      director: tenant.directorProfile
        ? { ...tenant.directorProfile, name: null }
        : null,
      principles: [],
      facilities: [],
      classes: tenant.classes.map((c: {
        id: string; name: string; gradeBand: string | null; days: string[]; startTime: string | null;
        endTime: string | null; textbook: string | null; description: string | null;
        seatsLeft: number | null; capacity: number | null; waitlistCount: number; sortOrder: number;
      }) => ({
        id: c.id, name: c.name, gradeBand: c.gradeBand, days: c.days,
        startTime: c.startTime, endTime: c.endTime, textbook: c.textbook,
        description: c.description, seatsLeft: c.seatsLeft, capacity: c.capacity,
        waitlistCount: c.waitlistCount, sortOrder: c.sortOrder,
      })),
      fees: tenant.fees.map((f: {
        id: string; classId: string | null; label: string; sessionsPerWeek: number | null;
        monthlyHours: number | null; amount: number; note: string | null;
      }) => ({
        id: f.id, classId: f.classId, label: f.label, sessionsPerWeek: f.sessionsPerWeek,
        monthlyHours: f.monthlyHours, amount: f.amount, note: f.note,
      })),
      extraCosts: tenant.extraCosts,
      refundPolicyText: null,
      reviews: tenant.reviews.map((r: {
        id: string; kind: string; body: string | null; authorLabel: string | null;
        source: string | null; beforeValue: string | null; afterValue: string | null;
        periodLabel: string | null; comment: string | null;
      }) => ({
        id: r.id, kind: r.kind, body: r.body, authorLabel: r.authorLabel,
        gradeBand: null, source: r.source, beforeValue: r.beforeValue,
        afterValue: r.afterValue, periodLabel: r.periodLabel, comment: r.comment,
      })),
      posts: tenant.posts.map((p: {
        id: string; category: string; title: string; publishedAt: Date | null;
      }) => ({
        id: p.id, category: p.category, title: p.title,
        summary: null, body: null, imageUrl: null, summaryFields: null,
        publishedAt: p.publishedAt,
      })),
      shuttle: [],
      levelTestSlots: tenant.levelTestSlots.map((s: { id: string; weekday: number | null; time: string | null }) => ({
        id: s.id, weekday: s.weekday, time: s.time,
      })),
    };
  } catch {
    return null;
  }
}

// ─── 소식 상세 조회 ───────────────────────────────────────────
export async function getPostData(slug: string, postId: string): Promise<AcademyPost | null> {
  if (slug === 'demo') {
    return DEMO_DATA.posts.find((p) => p.id === postId) ?? null;
  }
  try {
    const post = await prisma.post.findFirst({
      where: { id: postId, tenant: { slug }, status: 'published' },
    });
    if (!post) return null;
    return {
      id: post.id, category: post.category, title: post.title,
      summary: null, body: post.body ?? null, imageUrl: null,
      summaryFields: post.summaryFields as Record<string, string> | null,
      publishedAt: post.publishedAt,
    };
  } catch {
    return null;
  }
}
