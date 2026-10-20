import { describe, expect, it } from 'vitest';
import { gradeAttempt, isCorrect, normalizeShort, parseNumber, weakUnits } from '../grading';
import { itemStats } from '../stats';
import { renderMathText } from '../math';

const choice = { id: 'c1', type: 'choice' as const, answers: ['3'], unit: '일차방정식' };
const short = { id: 's1', type: 'short' as const, answers: ['1/2', '0.5'], unit: '유리수' };
const word = { id: 's2', type: 'short' as const, answers: ['Apple'], unit: null };

describe('채점', () => {
  it('객관식은 보기 번호로 비교한다', () => {
    expect(isCorrect(choice, '3')).toBe(true);
    expect(isCorrect(choice, ' 3 ')).toBe(true);
    expect(isCorrect(choice, '2')).toBe(false);
    expect(isCorrect(choice, '')).toBe(false);
    expect(isCorrect(choice, undefined)).toBe(false);
  });
  it('단답형은 표기가 달라도 같은 수면 정답', () => {
    for (const r of ['1/2', '0.5', '０.５', ' 2/4 ', '0.50']) expect(isCorrect(short, r), r).toBe(true);
    expect(isCorrect(short, '1/3')).toBe(false);
    expect(parseNumber('1,000')).toBe(1000);
    expect(parseNumber('−3')).toBe(-3);
    expect(parseNumber('1/0')).toBeNull();
  });
  it('단답형 글자는 대소문자·공백 무시', () => {
    expect(isCorrect(word, ' apple ')).toBe(true);
    expect(normalizeShort('A p p l e')).toBe('apple');
    expect(isCorrect(word, 'apples')).toBe(false);
  });
  it('점수 합계와 단원별 정답률, 약점 단원', () => {
    const r = gradeAttempt(
      [{ question: choice, points: 3 }, { question: short, points: 2 }, { question: word, points: 1 }],
      { c1: '3', s1: '1/3' },
    );
    expect(r.score).toBe(3);
    expect(r.maxScore).toBe(6);
    expect(r.items.find((i) => i.questionId === 's2')?.answer).toBeNull();
    expect(r.units).toEqual(expect.arrayContaining([
      { unit: '일차방정식', correct: 1, total: 1, rate: 1 },
      { unit: '유리수', correct: 0, total: 1, rate: 0 },
      { unit: '기타', correct: 0, total: 1, rate: 0 },
    ]));
    expect(weakUnits(r.units).map((u) => u.unit)).toEqual(['유리수', '기타']);
  });
});

describe('문항 통계', () => {
  const mk = (score: number, ans: string, correct: boolean) => ({ score, responses: [{ questionId: 'q', answer: ans, correct }] });
  it('정답률과 오답 선택지 분포', () => {
    const s = itemStats([{ id: 'q', difficulty: 3 }], [mk(10, '3', true), mk(5, '2', false), mk(4, '2', false), mk(1, '4', false)]);
    expect(s[0].correctRate).toBe(0.25);
    expect(s[0].choiceCounts).toEqual({ '3': 1, '2': 2, '4': 1 });
    expect(s[0].discrimination).toBeNull(); // 응시자 10명 미만
  });
  it('상위권이 더 틀리면 정답 오류 의심 경고', () => {
    const attempts = [
      ...Array.from({ length: 5 }, (_, i) => mk(90 - i, '2', false)),
      ...Array.from({ length: 5 }, (_, i) => mk(30 - i, '3', true)),
    ];
    const s = itemStats([{ id: 'q', difficulty: 3 }], attempts)[0];
    expect(s.discrimination).toBeLessThan(0);
    expect(s.flags).toContain('negative_discrimination');
  });
  it('전원 오답 경고', () => {
    const s = itemStats([{ id: 'q', difficulty: 1 }], Array.from({ length: 5 }, (_, i) => mk(i, '1', false)))[0];
    expect(s.flags).toContain('all_wrong');
  });
});

describe('수식 렌더링', () => {
  it('수식만 KaTeX로, 나머지는 이스케이프', () => {
    const html = renderMathText('<b>x</b> 값은? $x^2=4$');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('<b>');
  });
  it('위험한 KaTeX 명령은 실행하지 않는다', () => {
    const html = renderMathText('$\\href{javascript:alert(1)}{x}$');
    expect(html).not.toContain('javascript:');
  });
});
