// 시험지 자동 구성: 조건에 맞는 문항을 난이도 비율대로 고르고, 단원이 한쪽에 몰리지 않게 섞는다.

export type BankQuestion = { id: string; grade: string | null; unit: string | null; difficulty: number; archived: boolean };

export type ComposeOptions = {
  grade?: string;
  units?: string[];
  count: number;
  /** 쉬움(1-2)·보통(3)·어려움(4-5) 비율. 합이 1이 아니어도 비율로 쓴다 */
  mix?: { easy: number; medium: number; hard: number };
  exclude?: string[];
};

const band = (d: number) => (d <= 2 ? 'easy' : d === 3 ? 'medium' : 'hard');

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 단원별로 돌아가며 하나씩 뽑아 단원 쏠림을 줄인다 */
function roundRobinByUnit(pool: BankQuestion[], n: number): BankQuestion[] {
  const byUnit = new Map<string, BankQuestion[]>();
  for (const q of pool) {
    const k = q.unit ?? '';
    byUnit.set(k, [...(byUnit.get(k) ?? []), q]);
  }
  const queues = [...byUnit.values()];
  const out: BankQuestion[] = [];
  while (out.length < n && queues.some((qq) => qq.length)) {
    for (const qq of queues) {
      if (out.length >= n) break;
      const next = qq.shift();
      if (next) out.push(next);
    }
  }
  return out;
}

export function composeTest(bank: BankQuestion[], opts: ComposeOptions, rand: () => number = Math.random): string[] {
  const exclude = new Set(opts.exclude ?? []);
  const pool = shuffle(
    bank.filter((q) => !q.archived && !exclude.has(q.id) && (!opts.grade || q.grade === opts.grade) && (!opts.units?.length || (q.unit && opts.units.includes(q.unit)))),
    rand,
  );
  const mix = opts.mix ?? { easy: 0.3, medium: 0.4, hard: 0.3 };
  const total = mix.easy + mix.medium + mix.hard || 1;
  const want = {
    easy: Math.round((opts.count * mix.easy) / total),
    hard: Math.round((opts.count * mix.hard) / total),
    medium: 0,
  };
  want.medium = Math.max(0, opts.count - want.easy - want.hard);

  const picked: BankQuestion[] = [];
  for (const b of ['easy', 'medium', 'hard'] as const) {
    picked.push(...roundRobinByUnit(pool.filter((q) => band(q.difficulty) === b), want[b]));
  }
  // 어떤 난이도가 모자라면 남은 문항으로 채운다
  if (picked.length < opts.count) {
    const used = new Set(picked.map((q) => q.id));
    picked.push(...roundRobinByUnit(pool.filter((q) => !used.has(q.id)), opts.count - picked.length));
  }
  // 쉬운 문항부터 풀도록 난이도순 정렬
  return picked.sort((a, b) => a.difficulty - b.difficulty).map((q) => q.id);
}
