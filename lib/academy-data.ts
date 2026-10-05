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
  ga4MeasurementId: string | null;
  naverSiteVerification: string | null;
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

export type AcademyStaff = {
  id: string;
  name: string;
  roleLabel: string | null;
  photo: string | null;
  summary: string | null;
  sortOrder: number;
};

export type AcademyResultStat = {
  id: string;
  termLabel: string;
  metrics: { label: string; value: string; unit: string }[];
  basisText: string;
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
  staff: AcademyStaff[];
  resultStats: AcademyResultStat[];
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
    ga4MeasurementId: null,
    naverSiteVerification: null,
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
  staff: [],
  resultStats: [],
};

// ─── 데모 데이터 (result theme) ──────────────────────────────
export const DEMO_DATA_RESULT: AcademyPageData = {
  tenant: {
    slug: 'demo-result',
    name: '하이탑수학학원',
    theme: 'result',
    accentColor: '#1D3FA8',
    subjects: '수학',
    targetGrades: 'OO고 · OO여고 · OO고',
    address: '서울시 강남구 역삼로 200, 역삼빌딩 4층',
    phone: '02-2345-6789',
    hours: '평일 15:00~22:00 / 토 10:00~18:00',
    kakaoChannelUrl: '#',
    naverPlaceUrl: '#',
    naverMapEmbedUrl: null,
    regNo: '2345-강남-2024',
    locationHeadline: '역삼역 1번 출구 도보 3분',
    transitInfo: '**지하철** 2호선 역삼역 1번 출구, 도보 3분\n**버스** 역삼역 하차 · 146, 341번\n**주차** 건물 지하 1~2층',
    parkingInfo: null,
    ga4MeasurementId: null,
    naverSiteVerification: null,
  },
  sections: ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'consult_form'],
  director: {
    photo: null,
    name: '박수진',
    headline: '"학교별 기출을 직접 분석합니다."',
    philosophy: '시험 문제는 학교마다 다릅니다. 저는 매 시험마다 해당 학교 기출을 직접 분석하고 학생들에게 맞춤 대비를 제공합니다.',
    education: 'OO대학교 수학과',
    career: '대치동 OO학원 강사 7년, 현 하이탑수학학원 운영 5년',
    subjectsTaught: '고1·고2·고3 수학 전 과정',
  },
  principles: [],
  facilities: [],
  classes: [
    { id: 'c1', name: '고1 공통수학', gradeBand: '고1', days: ['화', '목'], startTime: '18:00', endTime: '20:30', textbook: '공통수학 1·2', description: '공통수학 내신 + 수능 기초 동시 진행', seatsLeft: 3, capacity: 8, waitlistCount: 0, sortOrder: 0 },
    { id: 'c2', name: '고2 내신반', gradeBand: '고2', days: ['월', '수', '금'], startTime: '19:00', endTime: '21:30', textbook: '대수·미적분Ⅰ', description: '내신 중심, 기출 4주 대비 시스템 적용', seatsLeft: 0, capacity: 8, waitlistCount: 4, sortOrder: 1 },
    { id: 'c3', name: '고3 수능반', gradeBand: '고3', days: ['월', '수', '금'], startTime: '19:30', endTime: '22:00', textbook: '수능 기출 문제집', description: '수능 실전 + 최저 등급 관리', seatsLeft: 2, capacity: 8, waitlistCount: 0, sortOrder: 2 },
  ],
  fees: [
    { id: 'f1', classId: 'c1', label: '고1 공통수학 · 주 2회', sessionsPerWeek: 2, monthlyHours: 20, amount: 380000, note: '교재비 별도' },
    { id: 'f2', classId: 'c2', label: '고2 내신반 · 주 3회', sessionsPerWeek: 3, monthlyHours: 30, amount: 420000, note: '교재비 별도' },
    { id: 'f3', classId: 'c3', label: '고3 수능반 · 주 3회', sessionsPerWeek: 3, monthlyHours: 30, amount: 450000, note: '교재비 별도' },
  ],
  extraCosts: [
    { id: 'e1', label: '교재비', amount: 15000, note: '실비 · 권당 약 15,000원' },
    { id: 'e2', label: '레벨테스트', amount: 0, note: '무료' },
  ],
  refundPolicyText: null,
  reviews: [
    { id: 'r1', kind: 'score_case', body: null, authorLabel: 'OO고 2학년', gradeBand: '고2', source: null, beforeValue: '4등급', afterValue: '2등급', periodLabel: '재원 6개월', comment: '학교 기출 분석으로 출제 패턴을 잡고, D-7부터 실전 모의로 마무리했습니다.' },
    { id: 'r2', kind: 'score_case', body: null, authorLabel: 'OO여고 1학년', gradeBand: '고1', source: null, beforeValue: '63점', afterValue: '88점', periodLabel: '재원 4개월', comment: '공통수학 개념 구멍을 먼저 메운 뒤, 기출 유형 분석으로 넘어갔습니다.' },
    { id: 'r3', kind: 'score_case', body: null, authorLabel: 'OO고 3학년', gradeBand: '고3', source: null, beforeValue: '5등급', afterValue: '3등급', periodLabel: '재원 1년', comment: '수능 기출 반복과 약점 유형 집중 공략이 효과가 있었습니다.' },
  ],
  posts: [],
  shuttle: [],
  levelTestSlots: [
    { id: 's1', weekday: 3, time: '17:00' },
    { id: 's2', weekday: 6, time: '10:00' },
  ],
  staff: [
    { id: 'st1', name: '박수진', roleLabel: '원장 · 고2·고3', photo: null, summary: 'OO대학교 수학과 · 대치동 강사 7년, 현 원장 5년', sortOrder: 0 },
    { id: 'st2', name: '이지훈', roleLabel: '강사 · 고1', photo: null, summary: 'OO대학교 수학교육과 · 내신 전문 3년', sortOrder: 1 },
    { id: 'st3', name: '최예원', roleLabel: '강사 · 중3 선행', photo: null, summary: 'OO대학교 수학과 · 선행·심화 전문 2년', sortOrder: 2 },
  ],
  resultStats: [
    {
      id: 'rs1',
      termLabel: '2026 1학기 기말',
      metrics: [
        { label: '내신 1등급', value: '12', unit: '명' },
        { label: '평균 상승 점수', value: '+18', unit: '점' },
        { label: '재등록률', value: '91', unit: '%' },
        { label: '대비한 학교', value: '7', unit: '곳' },
      ],
      basisText: '재원 3개월 이상 학생 전체 평균 · 개인 정보 비공개 · 학원 자체 집계',
    },
  ],
};

// ─── 데모 데이터 (bright theme) ──────────────────────────────
export const DEMO_DATA_BRIGHT: AcademyPageData = {
  tenant: {
    slug: 'demo-bright',
    name: '해피영어학원',
    theme: 'bright',
    accentColor: '#0F766E',
    subjects: '영어',
    targetGrades: '7세 ~ 초6',
    address: '서울시 마포구 동교로 150, 홍대빌딩 2층',
    phone: '02-3456-7890',
    hours: '평일 14:00~20:00 / 토 10:00~14:00',
    kakaoChannelUrl: '#',
    naverPlaceUrl: '#',
    naverMapEmbedUrl: null,
    regNo: '3456-마포-2024',
    locationHeadline: '홍대입구역 6번 출구 도보 5분',
    transitInfo: '**지하철** 2호선·공항철도 홍대입구역 6번 출구, 도보 5분\n**버스** 동교동 하차 · 271, 370번',
    parkingInfo: null,
    ga4MeasurementId: null,
    naverSiteVerification: null,
  },
  sections: ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'consult_form'],
  director: {
    photo: null,
    name: '김지선',
    headline: '"아이가 먼저 오고 싶은 학원"',
    philosophy: '영어가 두렵지 않고 즐거운 언어가 되도록 돕습니다.',
    education: 'OO대학교 영어교육과',
    career: '어린이 영어 교육 8년',
    subjectsTaught: '유치부·초등 영어 전 과정',
  },
  principles: [],
  facilities: [],
  classes: [
    { id: 'c1', name: '유치부', gradeBand: '7세', days: ['월', '수', '금'], startTime: '14:00', endTime: '14:50', textbook: '파닉스 그림책', description: '노래와 그림책으로 소리에 익숙해지기', seatsLeft: 2, capacity: 6, waitlistCount: 0, sortOrder: 0 },
    { id: 'c2', name: '초등 저학년', gradeBand: '초1~초3', days: ['화', '목', '금'], startTime: '15:00', endTime: '16:00', textbook: '파닉스·리더스', description: '파닉스 완성, 짧은 문장 말하기', seatsLeft: 4, capacity: 6, waitlistCount: 0, sortOrder: 1 },
    { id: 'c3', name: '초등 고학년', gradeBand: '초4~초6', days: ['화', '목'], startTime: '16:30', endTime: '18:10', textbook: '리딩·라이팅 교재', description: '리딩·라이팅, 중등 영어 준비', seatsLeft: 0, capacity: 6, waitlistCount: 3, sortOrder: 2 },
  ],
  fees: [
    { id: 'f1', classId: 'c1', label: '유치부 · 주 3회', sessionsPerWeek: 3, monthlyHours: 12, amount: 220000, note: '교재비 별도' },
    { id: 'f2', classId: 'c2', label: '초등 저학년 · 주 3회', sessionsPerWeek: 3, monthlyHours: 12, amount: 240000, note: '교재비 별도' },
    { id: 'f3', classId: 'c3', label: '초등 고학년 · 주 2회', sessionsPerWeek: 2, monthlyHours: 12, amount: 260000, note: '교재비 별도' },
  ],
  extraCosts: [
    { id: 'e1', label: '교재비', amount: 12000, note: '실비 · 권당 약 12,000원' },
    { id: 'e2', label: '체험 수업', amount: 0, note: '무료' },
  ],
  refundPolicyText: null,
  reviews: [
    { id: 'r1', kind: 'review', body: '"아이가 학원 가기 싫다는 말을 한 번도 안 했어요. 노래와 게임으로 배우니까 집에 와서도 영어 단어를 흥얼거려요."', authorLabel: '초2 학부모', gradeBand: '초등', source: '네이버 플레이스', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
    { id: 'r2', kind: 'review', body: '"한 반 6명이라 선생님이 아이 한 명 한 명을 이름으로 불러줘요. 수줍음이 많은 아이인데 여기 와서 발표도 자신감 있게 해요."', authorLabel: '7세 학부모', gradeBand: '유치부', source: '카카오톡', beforeValue: null, afterValue: null, periodLabel: null, comment: null },
  ],
  posts: [
    { id: 'p1', category: 'gallery', title: '10월 핼러윈 파티', summary: '아이들과 함께한 핼러윈 영어 수업', body: null, imageUrl: null, summaryFields: null, publishedAt: new Date('2026-10-01') },
    { id: 'p2', category: 'gallery', title: '9월 발표회', summary: '영어 발표회 모습', body: null, imageUrl: null, summaryFields: null, publishedAt: new Date('2026-09-15') },
    { id: 'p3', category: 'gallery', title: '여름방학 특강', summary: '여름방학 특강 수업 모습', body: null, imageUrl: null, summaryFields: null, publishedAt: new Date('2026-08-10') },
    { id: 'p4', category: 'gallery', title: '아이들 작품 전시', summary: '영어 작품 전시회', body: null, imageUrl: null, summaryFields: null, publishedAt: new Date('2026-07-20') },
  ],
  shuttle: [],
  levelTestSlots: [
    { id: 's1', weekday: 3, time: '15:00' },
    { id: 's2', weekday: 6, time: '11:00' },
  ],
  staff: [],
  resultStats: [],
};

// ─── 요일 숫자 → 한글 ────────────────────────────────────────
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export function weekdayLabel(n: number): string {
  return WEEKDAYS[n] ?? '';
}

// ─── DB 조회 ──────────────────────────────────────────────────
export async function getAcademyPageData(slug: string): Promise<AcademyPageData | null> {
  // Static demo data — no DB required
  if (slug === 'demo' || slug === 'demo-warm') return { ...DEMO_DATA, tenant: { ...DEMO_DATA.tenant, slug } };
  if (slug === 'demo-result') return DEMO_DATA_RESULT;
  if (slug === 'demo-bright') return DEMO_DATA_BRIGHT;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug, status: 'active' },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
        directorProfile: true,
        staffProfiles: { orderBy: { sortOrder: 'asc' } },
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
        resultStats: { where: { published: true }, orderBy: { id: 'desc' }, take: 3 },
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
        naverMapEmbedUrl: tenant.naverMapEmbedUrl,
        regNo: tenant.regNo,
        locationHeadline: tenant.locationHeadline,
        transitInfo: tenant.transitInfo,
        parkingInfo: tenant.parkingInfo,
        ga4MeasurementId: tenant.ga4MeasurementId,
        naverSiteVerification: tenant.naverSiteVerification,
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
        id: string; category: string; title: string; publishedAt: Date | null; images: string[];
      }) => ({
        id: p.id, category: p.category, title: p.title,
        summary: null, body: null,
        imageUrl: p.images.length > 0 ? p.images[0] : null,
        summaryFields: null,
        publishedAt: p.publishedAt,
      })),
      shuttle: [],
      levelTestSlots: tenant.levelTestSlots.map((s: { id: string; weekday: number | null; time: string | null }) => ({
        id: s.id, weekday: s.weekday, time: s.time,
      })),
      staff: tenant.staffProfiles.map((s: { id: string; name: string; roleLabel: string | null; photo: string | null; summary: string | null; sortOrder: number }) => ({
        id: s.id, name: s.name, roleLabel: s.roleLabel, photo: s.photo, summary: s.summary, sortOrder: s.sortOrder,
      })),
      resultStats: tenant.resultStats.map((rs: { id: string; termLabel: string; metrics: unknown; basisText: string }) => ({
        id: rs.id,
        termLabel: rs.termLabel,
        metrics: Array.isArray(rs.metrics) ? rs.metrics as { label: string; value: string; unit: string }[] : [],
        basisText: rs.basisText,
      })),
    };
  } catch {
    return null;
  }
}

// ─── 소식 상세 조회 ───────────────────────────────────────────
export async function getPostData(slug: string, postId: string): Promise<AcademyPost | null> {
  if (slug === 'demo' || slug === 'demo-warm') {
    return DEMO_DATA.posts.find((p) => p.id === postId) ?? null;
  }
  if (slug === 'demo-result') {
    return DEMO_DATA_RESULT.posts.find((p) => p.id === postId) ?? null;
  }
  if (slug === 'demo-bright') {
    return DEMO_DATA_BRIGHT.posts.find((p) => p.id === postId) ?? null;
  }
  try {
    const post = await prisma.post.findFirst({
      where: { id: postId, tenant: { slug }, status: 'published' },
    });
    if (!post) return null;
    return {
      id: post.id, category: post.category, title: post.title,
      summary: null, body: post.body ?? null,
      imageUrl: post.images.length > 0 ? post.images[0] : null,
      summaryFields: post.summaryFields as Record<string, string> | null,
      publishedAt: post.publishedAt,
    };
  } catch {
    return null;
  }
}
