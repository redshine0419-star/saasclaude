/**
 * 서술형 채점의 오답 유형 — 과목별 기본 목록 + 학원이 과목별로 고친 목록(tenants.errorTypes).
 * 응답에는 유형 이름(글자)을 그대로 저장한다 — 학원이 목록을 고쳐도 지난 채점 기록은 그대로 읽힌다.
 * 브라우저에서도 쓰므로 DB 모듈을 import하지 않는다.
 */

export const ERROR_SUBJECTS = ['수학', '영어', '국어', '과학', '사회', '기타'] as const;
export type ErrorSubject = (typeof ERROR_SUBJECTS)[number];

export const DEFAULT_ERROR_TYPES: Record<ErrorSubject, string[]> = {
  수학: ['개념 오류', '계산 실수', '조건 누락', '문제 해석', '풀이 과정 누락', '기타'],
  영어: ['어휘', '문법', '독해', '시제·어순', '철자', '문장 쓰기', '기타'],
  국어: ['어휘·어법', '사실적 이해', '추론적 이해', '문학 감상', '문법', '서술 표현', '기타'],
  과학: ['개념 오류', '계산·단위', '자료·그래프 해석', '실험 이해', '조건 누락', '기타'],
  사회: ['개념·용어', '자료 해석', '시대·지역 혼동', '서술 표현', '기타'],
  기타: ['개념 이해', '실수', '문제 이해', '기타'],
};

/** 예전 영문 키로 저장된 기록 읽기용 */
const LEGACY_LABEL: Record<string, string> = { concept: '개념 오류', calculation: '계산 실수', condition: '조건 누락', reading: '문제 해석', other: '기타' };

export const MAX_ERROR_TYPES = 10;
export const MAX_ERROR_TYPE_LEN = 12;

export type ErrorTypeConfig = Partial<Record<ErrorSubject, string[]>>;

/** 문항 과목 → 오답 유형 묶음 */
export function errorSubjectOf(subject: string | null | undefined): ErrorSubject {
  const s = subject ?? '';
  return (ERROR_SUBJECTS.find((x) => x !== '기타' && s.includes(x)) ?? '기타') as ErrorSubject;
}

export function errorTypesFor(subject: string | null | undefined, config: ErrorTypeConfig | null | undefined): string[] {
  const key = errorSubjectOf(subject);
  const own = config?.[key];
  return own && own.length ? own : DEFAULT_ERROR_TYPES[key];
}

/** 저장된 값 → 화면 표시 (예전 영문 키 호환) */
export function errorTypeLabel(stored: string | null | undefined): string | null {
  if (!stored) return null;
  return LEGACY_LABEL[stored] ?? stored;
}

/** DB JSON 읽기 — 모르는 과목·형식은 버린다 */
export function readErrorTypeConfig(raw: unknown): ErrorTypeConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: ErrorTypeConfig = {};
  for (const subj of ERROR_SUBJECTS) {
    const v = (raw as Record<string, unknown>)[subj];
    if (Array.isArray(v)) {
      const list = v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map((x) => x.trim().slice(0, MAX_ERROR_TYPE_LEN));
      if (list.length) out[subj] = [...new Set(list)].slice(0, MAX_ERROR_TYPES);
    }
  }
  return out;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** 관리자 저장 검사. 빈 목록이거나 기본값과 같으면 그 과목은 기본값을 쓴다(저장하지 않음) */
export function parseErrorTypeConfig(body: unknown): Result<ErrorTypeConfig> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: '잘못된 요청입니다.' };
  const out: ErrorTypeConfig = {};
  for (const [subj, v] of Object.entries(body as Record<string, unknown>)) {
    if (!(ERROR_SUBJECTS as readonly string[]).includes(subj)) return { ok: false, error: '알 수 없는 과목입니다.' };
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) return { ok: false, error: '유형 형식이 올바르지 않습니다.' };
    const list = (v as string[]).map((x) => x.trim()).filter(Boolean);
    if (list.some((x) => x.length > MAX_ERROR_TYPE_LEN)) return { ok: false, error: `유형 이름은 ${MAX_ERROR_TYPE_LEN}자까지 쓸 수 있습니다.` };
    const uniq = [...new Set(list)];
    if (uniq.length > MAX_ERROR_TYPES) return { ok: false, error: `유형은 과목마다 ${MAX_ERROR_TYPES}개까지 둘 수 있습니다.` };
    const def = DEFAULT_ERROR_TYPES[subj as ErrorSubject];
    if (uniq.length === 0 || uniq.join('|') === def.join('|')) continue;
    out[subj as ErrorSubject] = uniq;
  }
  return { ok: true, data: out };
}
