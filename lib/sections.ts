export type ThemeKey = 'warm' | 'result' | 'bright';

export const THEME_KEYS: ThemeKey[] = ['warm', 'result', 'bright'];

export const DEFAULT_SECTION_ORDER: Record<ThemeKey, string[]> = {
  warm: ['hero', 'quick_info', 'director', 'principles', 'classes', 'timetable', 'fees', 'reviews', 'news', 'faq', 'consult_form', 'location'],
  result: ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'faq', 'consult_form'],
  bright: ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'reviews', 'faq', 'consult_form'],
};

// 원장이 끌 수 없는 섹션. hero는 항상 맨 위에 고정된다.
export const LOCKED_SECTIONS = new Set(['hero', 'consult_form']);

export const SECTION_LABELS: Record<string, string> = {
  hero: '메인 히어로',
  quick_info: '학원 한눈에 보기',
  director: '원장 소개',
  principles: '교육 원칙',
  classes: '수업·강좌',
  timetable: '시간표',
  fees: '교습비',
  reviews: '학부모 후기',
  news: '소식',
  faq: '자주 묻는 질문',
  consult_form: '상담 신청 폼',
  location: '오시는 길',
  results_stats: '입시 실적',
  exam_system: '시험 체계',
  curriculum: '커리큘럼',
  score_cases: '성적 사례',
  teachers: '강사진',
  day_flow: '하루 일과',
  gallery: '갤러리',
  safety: '안심 등하원',
};

export function isThemeKey(v: unknown): v is ThemeKey {
  return typeof v === 'string' && (THEME_KEYS as string[]).includes(v);
}

export type SectionInput = { key: string; enabled: boolean };

/**
 * 원장이 보낸 섹션 배열을 테마 규칙에 맞게 정규화한다.
 * - 테마에 없는 키는 버린다
 * - 빠진 키는 꺼진 상태로 뒤에 붙인다
 * - 잠금 섹션은 항상 켜고, hero는 0번으로 올린다
 */
export function normalizeSections(theme: ThemeKey, input: SectionInput[]) {
  const allowed = DEFAULT_SECTION_ORDER[theme];
  const seen = new Set<string>();
  const ordered: SectionInput[] = [];

  for (const s of input) {
    if (!allowed.includes(s.key) || seen.has(s.key)) continue;
    seen.add(s.key);
    ordered.push({ key: s.key, enabled: LOCKED_SECTIONS.has(s.key) ? true : !!s.enabled });
  }
  for (const key of allowed) {
    if (!seen.has(key)) ordered.push({ key, enabled: LOCKED_SECTIONS.has(key) });
  }

  const heroIdx = ordered.findIndex((s) => s.key === 'hero');
  if (heroIdx > 0) ordered.unshift(...ordered.splice(heroIdx, 1));

  return ordered.map((s, i) => ({ ...s, sortOrder: i }));
}
