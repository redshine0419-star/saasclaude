import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = { testAttempt: { findUnique: vi.fn() }, studentScore: { upsert: vi.fn() } };
vi.mock('@/lib/prisma', () => ({ prisma: db }));
const { syncStudentScore } = await import('../student');
const { testLinkSms } = await import('@/lib/sms/constants');

const attempt = (over: object = {}) => ({
  id: 'a1', tenantId: 't1', studentId: 's1', status: 'submitted', score: 18, maxScore: 24, needsGrading: false,
  submittedAt: new Date('2026-11-15T16:30:00Z'), // KST 11월 16일
  test: { title: '중2 단원평가', items: [{ question: { subject: '수학' } }, { question: { subject: '수학' } }, { question: { subject: '영어' } }] },
  tenant: { subjects: '영어, 수학' },
  ...over,
});

describe('syncStudentScore', () => {
  beforeEach(() => { db.testAttempt.findUnique.mockReset(); db.studentScore.upsert.mockReset(); });

  it('재원생 제출 점수를 학원 테스트 성적으로 한 줄만 (응시별 upsert)', async () => {
    db.testAttempt.findUnique.mockResolvedValue(attempt());
    await syncStudentScore('a1');
    const arg = db.studentScore.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ attemptId: 'a1' });
    expect(arg.create).toMatchObject({ tenantId: 't1', studentId: 's1', attemptId: 'a1', kind: 'academy', subject: '수학', score: 18, maxScore: 24, label: '중2 단원평가' });
    expect(arg.create.examDate.toISOString().slice(0, 10)).toBe('2026-11-16');
  });
  it('서술형 채점 전이면 메모로 알린다', async () => {
    db.testAttempt.findUnique.mockResolvedValue(attempt({ needsGrading: true }));
    await syncStudentScore('a1');
    expect(db.studentScore.upsert.mock.calls[0][0].create.memo).toContain('채점 전');
  });
  it('상담 응시·미제출은 기록하지 않는다', async () => {
    db.testAttempt.findUnique.mockResolvedValue(attempt({ studentId: null }));
    expect(await syncStudentScore('a1')).toBeNull();
    db.testAttempt.findUnique.mockResolvedValue(attempt({ status: 'in_progress' }));
    expect(await syncStudentScore('a1')).toBeNull();
    expect(db.studentScore.upsert).not.toHaveBeenCalled();
  });
});

describe('testLinkSms', () => {
  it('학원명·학생·시험명·링크가 들어간다', () => {
    const t = testLinkSms('하늘수학', '김도윤', '중2 단원평가', 'https://growweb.me/x/test/abc');
    expect(t).toContain('[하늘수학] 김도윤 학생');
    expect(t).toContain('"중2 단원평가"');
    expect(t.endsWith('https://growweb.me/x/test/abc')).toBe(true);
  });
});
