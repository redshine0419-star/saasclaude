/**
 * 홈페이지 섹션 문구 (원장 편집, tenants.sectionCopy JSON).
 * 제목은 비우면 기본 제목을 쓴다. 항목형 섹션(하루 일과·안심·시험 대비)은 저장한 항목이 있으면 그걸 쓴다.
 * '안심하고 보내세요'는 CCTV·경력 조회 같은 사실 주장이라 기본 항목을 공개하지 않는다 — 원장이 입력한 것만 보인다.
 * 브라우저에서도 쓰므로 DB 모듈을 import하지 않는다.
 */

export type CopyItem = { code?: string; title: string; body: string };
export type SectionCopyEntry = { title?: string; items?: CopyItem[] };
export type SectionCopy = Record<string, SectionCopyEntry>;

type ItemSpec = { max: number; code?: number; title: number; body: number; labels: { code?: string; title: string; body: string } };
type Spec = { title: string; items?: ItemSpec & { defaults: CopyItem[]; publishDefaults: boolean; hint?: string } };

export const TITLE_MAX = 30;

export const SECTION_COPY_SPEC: Record<string, Spec> = {
  principles: { title: '흔들리지 않는 수업의 기준' },
  classes: { title: '학년별 반 구성' },
  timetable: { title: '요일별 수업 편성' },
  fees: { title: '숨김 없이\n먼저 알려드립니다' },
  reviews: { title: '학부모님이 직접 남긴 이야기' },
  news: { title: '새 소식' },
  results_stats: { title: '숫자로 보는 지난 학기' },
  curriculum: { title: '학년별 커리큘럼' },
  score_cases: { title: '성적 변화 사례' },
  teachers: { title: '강사진' },
  gallery: { title: '이번 달 수업 모습' },
  consult_form: { title: '지금 바로\n신청하세요' },
  exam_system: {
    title: '시험 4주 전부터 정해진 순서대로',
    items: {
      max: 6, code: 8, title: 16, body: 60, publishDefaults: true,
      labels: { code: '시점', title: '단계', body: '설명' },
      defaults: [
        { code: 'D-28', title: '범위 확정', body: '학교별 시험 범위와\n교과서·부교재 정리' },
        { code: 'D-21', title: '개념 완성', body: '단원별 확인 테스트,\n오답 재풀이' },
        { code: 'D-14', title: '기출 반복', body: '해당 학교 최근\n기출문제 집중 분석' },
        { code: 'D-7', title: '실전 모의', body: '시간 재고 푸는\n예상 문제 풀이' },
        { code: '시험 후', title: '결과 분석', body: '학부모님께\n개별 결과 안내' },
      ],
    },
  },
  day_flow: {
    title: '우리 아이의 학원 하루',
    items: {
      max: 6, title: 16, body: 60, publishDefaults: true,
      labels: { title: '단계', body: '설명' },
      defaults: [
        { title: '등원', body: '선생님이 출석을 확인하고 오늘 할 일을 안내해요' },
        { title: '워밍업', body: '짧은 활동으로 수업을 시작해요' },
        { title: '본 수업', body: '개념 설명과 문제 풀이를 함께 해요' },
        { title: '확인', body: '오늘 배운 내용을 아이가 직접 설명해 봐요' },
        { title: '하원', body: '다음 수업 숙제를 확인하고 하원해요' },
      ],
    },
  },
  safety: {
    title: '안심하고 보내세요',
    items: {
      max: 6, title: 16, body: 30, publishDefaults: false,
      labels: { title: '항목', body: '내용' },
      hint: '실제로 운영하고 있는 것만 적어 주세요. 하지 않는 내용을 적으면 허위 광고가 될 수 있습니다. 입력한 항목만 홈페이지에 보입니다.',
      defaults: [
        { title: '셔틀 동승 선생님', body: '모든 노선 동승' },
        { title: '교실 CCTV', body: '녹화 운영' },
        { title: '선생님 자격', body: '성범죄 경력 조회 완료' },
      ],
    },
  },
};

/** 섹션 제목 (줄바꿈 포함) */
export function sectionTitle(copy: SectionCopy | null | undefined, key: string): string {
  return copy?.[key]?.title?.trim() || SECTION_COPY_SPEC[key]?.title || '';
}

/** 공개 화면에 보일 항목 — 저장한 게 있으면 그것, 없으면 공개 가능한 기본 항목만 */
export function sectionItems(copy: SectionCopy | null | undefined, key: string): CopyItem[] {
  const saved = copy?.[key]?.items;
  if (saved && saved.length) return saved;
  const spec = SECTION_COPY_SPEC[key]?.items;
  return spec?.publishDefaults ? spec.defaults : [];
}

/** DB JSON → SectionCopy (모르는 키·형식은 버린다) */
export function readSectionCopy(raw: unknown): SectionCopy {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: SectionCopy = {};
  for (const [key, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!SECTION_COPY_SPEC[key] || !v || typeof v !== 'object') continue;
    const e = v as { title?: unknown; items?: unknown };
    const entry: SectionCopyEntry = {};
    if (typeof e.title === 'string' && e.title.trim()) entry.title = e.title;
    if (Array.isArray(e.items)) {
      entry.items = e.items
        .filter((i): i is CopyItem => !!i && typeof i === 'object' && typeof (i as CopyItem).title === 'string')
        .map((i) => ({ ...(typeof i.code === 'string' && i.code ? { code: i.code } : {}), title: i.title, body: typeof i.body === 'string' ? i.body : '' }));
    }
    out[key] = entry;
  }
  return out;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** 관리자 저장 검사 */
export function parseSectionCopy(body: unknown): Result<SectionCopy> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: '잘못된 요청입니다.' };
  const out: SectionCopy = {};
  for (const [key, v] of Object.entries(body as Record<string, unknown>)) {
    const spec = SECTION_COPY_SPEC[key];
    if (!spec) return { ok: false, error: '알 수 없는 섹션입니다.' };
    if (!v || typeof v !== 'object') continue;
    const e = v as { title?: unknown; items?: unknown };
    const entry: SectionCopyEntry = {};
    if (e.title != null && e.title !== '') {
      if (typeof e.title !== 'string') return { ok: false, error: '제목 형식이 올바르지 않습니다.' };
      const t = e.title.replace(/\r/g, '').trim();
      if (t.length > TITLE_MAX) return { ok: false, error: `제목은 ${TITLE_MAX}자까지 쓸 수 있습니다.` };
      if (t.split('\n').filter((l) => l.trim()).length > 2) return { ok: false, error: '제목은 2줄까지 쓸 수 있습니다.' };
      if (t) entry.title = t;
    }
    if (e.items != null) {
      if (!spec.items) return { ok: false, error: '이 섹션은 항목을 편집할 수 없습니다.' };
      if (!Array.isArray(e.items)) return { ok: false, error: '항목 형식이 올바르지 않습니다.' };
      const items: CopyItem[] = [];
      for (const raw of e.items) {
        const i = (raw ?? {}) as Record<string, unknown>;
        const str = (x: unknown) => (typeof x === 'string' ? x.replace(/\r/g, '').trim() : '');
        const title = str(i.title);
        const body2 = str(i.body);
        const code = str(i.code);
        if (!title && !body2 && !code) continue; // 빈 줄은 무시
        if (!title) return { ok: false, error: `${spec.items.labels.title}을(를) 입력해 주세요.` };
        if (title.length > spec.items.title || body2.length > spec.items.body || (spec.items.code && code.length > spec.items.code)) {
          return { ok: false, error: '항목 글자 수가 너무 깁니다.' };
        }
        items.push({ ...(spec.items.code && code ? { code } : {}), title, body: body2 });
      }
      if (items.length > spec.items.max) return { ok: false, error: `항목은 ${spec.items.max}개까지 넣을 수 있습니다.` };
      entry.items = items;
    }
    if (entry.title || entry.items) out[key] = entry;
  }
  return { ok: true, data: out };
}
