// 레벨테스트 자동 채점. DB와 무관한 순수 함수로 두어 테스트한다.

export type GradableQuestion = {
  id: string;
  type: 'choice' | 'short';
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

export type GradedItem = { questionId: string; answer: string | null; correct: boolean; points: number; maxPoints: number; unit: string | null };

export type GradeResult = {
  score: number;
  maxScore: number;
  items: GradedItem[];
  /** 단원별 정답률 — 결과지와 약점 단원 표시에 쓴다 */
  units: { unit: string; correct: number; total: number; rate: number }[];
};

export function gradeAttempt(items: GradableItem[], responses: Record<string, string | undefined>): GradeResult {
  const graded: GradedItem[] = items.map(({ question, points }) => {
    const answer = responses[question.id] ?? null;
    const correct = isCorrect(question, answer);
    return { questionId: question.id, answer, correct, points: correct ? points : 0, maxPoints: points, unit: question.unit?.trim() || null };
  });

  const unitMap = new Map<string, { correct: number; total: number }>();
  for (const g of graded) {
    const key = g.unit ?? '기타';
    const u = unitMap.get(key) ?? { correct: 0, total: 0 };
    u.total++;
    if (g.correct) u.correct++;
    unitMap.set(key, u);
  }

  return {
    score: graded.reduce((s, g) => s + g.points, 0),
    maxScore: graded.reduce((s, g) => s + g.maxPoints, 0),
    items: graded,
    units: [...unitMap.entries()].map(([unit, u]) => ({ unit, ...u, rate: u.total ? u.correct / u.total : 0 })),
  };
}

/** 정답률이 낮은 단원부터. 문항이 하나뿐인 단원도 포함한다(레벨테스트는 문항 수가 적다). */
export function weakUnits(units: GradeResult['units'], limit = 3) {
  return units
    .filter((u) => u.rate < 1)
    .sort((a, b) => a.rate - b.rate || b.total - a.total)
    .slice(0, limit);
}
