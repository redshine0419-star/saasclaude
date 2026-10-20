// 문항 통계: 정답률, 오답 선택지 분포, 변별도, 품질 경고.

export type StatAttempt = {
  score: number;
  responses: { questionId: string; answer: string; correct: boolean | null }[];
};

export type ItemStat = {
  questionId: string;
  n: number;
  correctRate: number | null;
  /** 객관식: 보기 번호별 선택 수 (무응답 제외) */
  choiceCounts: Record<string, number>;
  /** 상위 27% 정답률 − 하위 27% 정답률. 응시자가 적으면 null */
  discrimination: number | null;
  flags: ('all_wrong' | 'all_right' | 'negative_discrimination' | 'difficulty_mismatch')[];
};

export const MIN_N_FOR_DISCRIMINATION = 10;

/** 설정 난이도(1~5)로 기대하는 정답률 범위 */
const EXPECTED_RATE: Record<number, [number, number]> = {
  1: [0.7, 1], 2: [0.55, 0.95], 3: [0.35, 0.8], 4: [0.2, 0.65], 5: [0, 0.5],
};

export function itemStats(
  questions: { id: string; difficulty: number }[],
  attempts: StatAttempt[],
): ItemStat[] {
  const sorted = [...attempts].sort((a, b) => b.score - a.score);
  const k = Math.max(1, Math.round(sorted.length * 0.27));
  const upper = new Set(sorted.slice(0, k));
  const lower = new Set(sorted.slice(-k));

  return questions.map((q) => {
    let n = 0;
    let right = 0;
    const choiceCounts: Record<string, number> = {};
    let upRight = 0, upN = 0, lowRight = 0, lowN = 0;

    for (const a of attempts) {
      const r = a.responses.find((x) => x.questionId === q.id);
      n++;
      const ok = !!r?.correct;
      if (ok) right++;
      if (r?.answer) choiceCounts[r.answer] = (choiceCounts[r.answer] ?? 0) + 1;
      if (upper.has(a)) { upN++; if (ok) upRight++; }
      if (lower.has(a)) { lowN++; if (ok) lowRight++; }
    }

    const correctRate = n ? right / n : null;
    const discrimination = attempts.length >= MIN_N_FOR_DISCRIMINATION && upN && lowN ? upRight / upN - lowRight / lowN : null;

    const flags: ItemStat['flags'] = [];
    if (n >= 5 && right === 0) flags.push('all_wrong');
    if (n >= 5 && right === n) flags.push('all_right');
    if (discrimination !== null && discrimination < 0) flags.push('negative_discrimination');
    const range = EXPECTED_RATE[q.difficulty];
    if (n >= MIN_N_FOR_DISCRIMINATION && correctRate !== null && range && (correctRate < range[0] - 0.1 || correctRate > range[1] + 0.1)) {
      flags.push('difficulty_mismatch');
    }

    return { questionId: q.id, n, correctRate, choiceCounts, discrimination, flags };
  });
}

export const FLAG_LABEL: Record<ItemStat['flags'][number], string> = {
  all_wrong: '전원 오답 — 정답이 맞게 입력됐는지 확인',
  all_right: '전원 정답 — 변별력 없음',
  negative_discrimination: '상위권이 더 많이 틀림 — 정답 오류 의심',
  difficulty_mismatch: '설정 난이도와 실제 정답률이 다름',
};
