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

import { parseQuestionInput } from '../question-input';

describe('문항 입력 검증', () => {
  it('객관식: 끝의 빈 보기는 버리고 정답 번호를 확인한다', () => {
    const r = parseQuestionInput({ type: 'choice', subject: '수학', body: '1+1=?', choices: ['1', '2', '3', '', ''], answers: ['2'], difficulty: 9, points: 0 });
    expect(r.ok && r.value).toMatchObject({ choices: ['1', '2', '3'], answers: ['2'], difficulty: 5, points: 1 });
    expect(parseQuestionInput({ type: 'choice', subject: '수학', body: 'x', choices: ['1', '2'], answers: ['3'] }).ok).toBe(false);
    expect(parseQuestionInput({ type: 'choice', subject: '수학', body: 'x', choices: ['1', '', '3'], answers: ['1'] }).ok).toBe(false);
  });
  it('단답형: 줄바꿈으로 여러 정답, 중복 제거', () => {
    const r = parseQuestionInput({ type: 'short', subject: '수학', body: 'x', answers: '1/2\n0.5\n0.5\n' });
    expect(r.ok && r.value.answers).toEqual(['1/2', '0.5']);
    expect(r.ok && r.value.choices).toBeNull();
  });
  it('필수값·그림 주소 검사', () => {
    expect(parseQuestionInput({ type: 'short', subject: '', body: 'x', answers: '1' }).ok).toBe(false);
    expect(parseQuestionInput({ type: 'short', subject: '수학', body: 'x', answers: '1', imageUrl: 'javascript:x' }).ok).toBe(false);
    expect(parseQuestionInput({ type: 'ox', subject: '수학', body: 'x' }).ok).toBe(false);
  });
});

import { composeTest, type BankQuestion } from '../compose';

describe('시험지 자동 구성', () => {
  let seed = 1;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const bank: BankQuestion[] = Array.from({ length: 30 }, (_, i) => ({
    id: `q${i}`, grade: i < 24 ? '중2' : '중3', unit: ['일차함수', '연립방정식', '부등식'][i % 3], difficulty: (i % 5) + 1, archived: i === 0,
  }));

  it('학년·보관 조건을 지키고 요청한 개수만큼 고른다', () => {
    const ids = composeTest(bank, { grade: '중2', count: 10 }, rand);
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    expect(ids).not.toContain('q0');
    expect(ids.every((id) => Number(id.slice(1)) < 24)).toBe(true);
  });
  it('난이도 비율과 단원 분산, 쉬운 순서', () => {
    const ids = composeTest(bank, { grade: '중2', count: 9, mix: { easy: 1, medium: 1, hard: 1 } }, rand);
    const qs = ids.map((id) => bank.find((b) => b.id === id)!);
    const bands = qs.map((q) => (q.difficulty <= 2 ? 'e' : q.difficulty === 3 ? 'm' : 'h'));
    expect(bands.filter((b) => b === 'e')).toHaveLength(3);
    expect(bands.filter((b) => b === 'h')).toHaveLength(3);
    expect(new Set(qs.map((q) => q.unit)).size).toBe(3);
    expect(qs.map((q) => q.difficulty)).toEqual([...qs.map((q) => q.difficulty)].sort((a, b) => a - b));
  });
  it('문항이 모자라면 있는 만큼만', () => {
    expect(composeTest(bank, { grade: '중3', count: 20 }, rand)).toHaveLength(6);
  });
});

import { parseManualPoints, unitRates } from '../grading';

describe('서술형', () => {
  const essay = { id: 'e1', type: 'essay' as const, answers: [], unit: '일차방정식' };
  it('자동 채점하지 않고 채점 대기로 남긴다', () => {
    const r = gradeAttempt([{ question: choice, points: 2 }, { question: essay, points: 5 }], { c1: '3', e1: '풀이...' });
    expect(r.score).toBe(2);
    expect(r.maxScore).toBe(7);
    expect(r.pending).toBe(1);
    expect(r.items.find((i) => i.questionId === 'e1')?.correct).toBeNull();
    // 채점 대기 문항은 단원 정답률에서 빠진다
    expect(r.units).toEqual([{ unit: '일차방정식', correct: 1, total: 1, rate: 1 }]);
  });
  it('선생님 점수는 0~배점 정수만', () => {
    expect(parseManualPoints('3', 5)).toBe(3);
    expect(parseManualPoints(0, 5)).toBe(0);
    for (const v of ['', null, undefined, '6', -1, 2.5, 'abc']) expect(parseManualPoints(v, 5), String(v)).toBeNull();
  });
  it('unitRates는 채점 대기를 건너뛴다', () => {
    expect(unitRates([{ unit: 'a', correct: null }, { unit: 'a', correct: true }])).toEqual([{ unit: 'a', correct: 1, total: 1, rate: 1 }]);
  });
  it('서술형 입력은 정답 없이 저장된다', () => {
    const r = parseQuestionInput({ type: 'essay', subject: '수학', body: '풀이 과정을 쓰시오', explanation: '모범답안' });
    expect(r.ok && r.value).toMatchObject({ type: 'essay', answers: [], choices: null, explanation: '모범답안' });
  });
});
