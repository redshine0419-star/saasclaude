// 문항 입력 검증. 생성·수정 API가 함께 쓴다.

export type QuestionInput = {
  type: 'choice' | 'short' | 'essay';
  subject: string;
  grade: string | null;
  unit: string | null;
  difficulty: number;
  body: string;
  imageUrl: string | null;
  choices: string[] | null;
  answers: string[];
  explanation: string | null;
  points: number;
};

export const LIMITS = { body: 3000, choice: 500, choices: 8, answers: 10, answer: 100, explanation: 3000 };

function text(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function parseQuestionInput(raw: unknown): { ok: true; value: QuestionInput } | { ok: false; error: string } {
  const b = (raw ?? {}) as Record<string, unknown>;
  const type = b.type === 'short' ? 'short' : b.type === 'choice' ? 'choice' : b.type === 'essay' ? 'essay' : null;
  if (!type) return { ok: false, error: '문항 유형을 선택해 주세요.' };

  const subject = text(b.subject, 20);
  if (!subject) return { ok: false, error: '과목을 입력해 주세요.' };

  const body = text(b.body, LIMITS.body);
  if (!body) return { ok: false, error: '문제 본문을 입력해 주세요.' };

  const difficulty = Math.min(5, Math.max(1, Math.round(Number(b.difficulty) || 3)));
  const points = Math.min(100, Math.max(1, Math.round(Number(b.points) || 1)));

  const imageUrl = text(b.imageUrl, 1000);
  if (imageUrl && !/^https:\/\//.test(imageUrl)) return { ok: false, error: '그림 주소가 올바르지 않습니다.' };

  let choices: string[] | null = null;
  let answers: string[];

  if (type === 'choice') {
    const list = Array.isArray(b.choices) ? b.choices.map((c) => text(c, LIMITS.choice)) : [];
    while (list.length && !list[list.length - 1]) list.pop();
    if (list.length < 2) return { ok: false, error: '보기를 2개 이상 입력해 주세요.' };
    if (list.length > LIMITS.choices) return { ok: false, error: `보기는 ${LIMITS.choices}개까지 넣을 수 있습니다.` };
    if (list.some((c) => !c)) return { ok: false, error: '비어 있는 보기가 있습니다.' };
    const ans = Number(Array.isArray(b.answers) ? b.answers[0] : b.answers);
    if (!Number.isInteger(ans) || ans < 1 || ans > list.length) return { ok: false, error: '정답 보기를 선택해 주세요.' };
    choices = list;
    answers = [String(ans)];
  } else if (type === 'essay') {
    // 서술형은 선생님이 채점한다. 모범답안·채점 기준은 해설(explanation)에 적는다
    answers = [];
  } else {
    const list = (Array.isArray(b.answers) ? b.answers : String(b.answers ?? '').split(/\n/))
      .map((a) => text(a, LIMITS.answer))
      .filter(Boolean);
    if (list.length === 0) return { ok: false, error: '정답을 하나 이상 입력해 주세요.' };
    answers = [...new Set(list)].slice(0, LIMITS.answers);
  }

  return {
    ok: true,
    value: {
      type,
      subject,
      grade: text(b.grade, 20) || null,
      unit: text(b.unit, 40) || null,
      difficulty,
      body,
      imageUrl: imageUrl || null,
      choices,
      answers,
      explanation: text(b.explanation, LIMITS.explanation) || null,
      points,
    },
  };
}
