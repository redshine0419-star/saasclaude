import { describe, expect, it, vi, beforeEach } from 'vitest';

const findUnique = vi.fn();
vi.mock('@/lib/prisma', () => ({ prisma: { messageTemplate: { findUnique } } }));

const { resolveTemplate, fillTemplate, PLATFORM_TEMPLATES } = await import('../templates');

describe('resolveTemplate', () => {
  beforeEach(() => findUnique.mockReset());

  it('학원 승인 문구가 있으면 우선한다', async () => {
    findUnique.mockResolvedValue({ reviewStatus: 'approved', approvedBody: '학원 문구' });
    expect(await resolveTemplate('t1', 'receipt')).toEqual({ body: '학원 문구', source: 'tenant' });
  });

  it('승인 대기 문구는 쓰지 않고 공용 문구로 보낸다', async () => {
    findUnique.mockResolvedValue({ reviewStatus: 'pending', approvedBody: null });
    expect(await resolveTemplate('t1', 'receipt')).toEqual({ body: PLATFORM_TEMPLATES.receipt, source: 'platform' });
  });

  it('광고성 시나리오는 공용 문구가 없어 발송하지 않는다', async () => {
    findUnique.mockResolvedValue(null);
    expect(await resolveTemplate('t1', 'followup')).toBeNull();
    expect(await resolveTemplate('t1', 'campaign')).toBeNull();
  });
});

describe('fillTemplate', () => {
  it('변수를 채우고 상담 유형을 한글로 바꾼다', () => {
    const out = fillTemplate(PLATFORM_TEMPLATES.receipt!, { 학부모명: '홍길동', 학원명: '하늘수학', 학생학년: null, 상담유형: 'level_test' });
    expect(out).toContain('[하늘수학] 홍길동님');
    expect(out).toContain('레벨테스트');
    expect(out).toContain('미기재');
    expect(out).not.toMatch(/#\{/);
  });
});
