// 레벨테스트 자동 채점. DB와 무관한 순수 함수로 두어 테스트한다.

export type GradableQuestion = {
  id: string;
  type: 'choice' | 'short' | 'essay';
  answers: string[];
  unit?: string | null;
};

export type GradableItem = { question: GradableQuestion; points: number };

/** 단답형 비교용 정규화: 전각→반각, 공백·쉼표(천 단위) 제거, 유니코드 마이너스, 소문자 */
export function normalizeShort(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[−–—]/g, '-')
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/** "1/2", "-3/4", "0.5", "2" 같은 수를 숫자로. 수가 아니면 null */
export function parseNumber(raw: string): number | null {
  const s = normalizeShort(raw);
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  return /^-?\d+(?:\.\d+)?$/.test(s) ? Number(s) : null;
}

export function isCorrect(q: GradableQuestion, response: string | null | undefined): boolean {
  if (q.type === 'essay') return false; // 서술형은 자동 채점하지 않는다
  if (response == null || response.trim() === '') return false;
  if (q.type === 'choice') {
    return q.answers.some((a) => a.trim() === response.trim());
  }
  const given = normalizeShort(response);
  const givenNum = parseNumber(response);
  return q.answers.some((a) => {
    if (normalizeShort(a) === given) return true;
    const n = parseNumber(a);
    return n !== null && givenNum !== null && Math.abs(n - givenNum) < 1e-9;
  });
}

/** correct가 null이면 선생님 채점 대기(서술형) */
export type GradedItem = { questionId: string; answer: string | null; correct: boolean | null; points: number; maxPoints: number; unit: string | null };

export type GradeResult = {
  /** 채점이 끝난 문항의 점수 합 (서술형 채점 전에는 자동 채점분만) */
  score: number;
  maxScore: number;
  /** 선생님 채점을 기다리는 서술형 문항 수 */
  pending: number;
  items: GradedItem[];
  /** 단원별 정답률 — 결과지와 약점 단원 표시에 쓴다 */
  units: { unit: string; correct: number; total: number; rate: number }[];
};

export function gradeAttempt(items: GradableItem[], responses: Record<string, string | undefined>): GradeResult {
  const graded: GradedItem[] = items.map(({ question, points }) => {
    const answer = responses[question.id] ?? null;
    const unit = question.unit?.trim() || null;
    if (question.type === 'essay') return { questionId: question.id, answer, correct: null, points: 0, maxPoints: points, unit };
    const correct = isCorrect(question, answer);
    return { questionId: question.id, answer, correct, points: correct ? points : 0, maxPoints: points, unit };
  });

  return {
    score: graded.reduce((s, g) => s + g.points, 0),
    maxScore: graded.reduce((s, g) => s + g.maxPoints, 0),
    pending: graded.filter((g) => g.correct === null).length,
    items: graded,
    units: unitRates(graded),
  };
}

/** 문항별 정오로 단원별 정답률을 낸다 (단원 없는 문항은 '기타', 채점 대기 문항은 제외) */
export function unitRates(items: { unit: string | null; correct: boolean | null }[]): GradeResult['units'] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const g of items) {
    if (g.correct === null) continue;
    const key = g.unit ?? '기타';
    const u = map.get(key) ?? { correct: 0, total: 0 };
    u.total++;
    if (g.correct) u.correct++;
    map.set(key, u);
  }
  return [...map.entries()].map(([unit, u]) => ({ unit, ...u, rate: u.total ? u.correct / u.total : 0 }));
}

/** 정답률이 낮은 단원부터. 문항이 하나뿐인 단원도 포함한다(레벨테스트는 문항 수가 적다). */
export function weakUnits(units: GradeResult['units'], limit = 3) {
  return units
    .filter((u) => u.rate < 1)
    .sort((a, b) => a.rate - b.rate || b.total - a.total)
    .slice(0, limit);
}

/** 서술형 문항당 풀이 사진 최대 장수 */
export const MAX_ESSAY_PHOTOS = 3;

export const ERROR_TYPES = {
  concept: '개념 오류',
  calculation: '계산 실수',
  condition: '조건 누락',
  reading: '문제 해석',
  other: '기타',
} as const;
export type ErrorType = keyof typeof ERROR_TYPES;

/** 선생님이 매긴 서술형 점수 검증: 0 ~ 배점 사이 정수 */
export function parseManualPoints(raw: unknown, max: number): number | null {
  const n = Number(raw);
  if (raw === '' || raw === null || raw === undefined || !Number.isInteger(n) || n < 0 || n > max) return null;
  return n;
}

