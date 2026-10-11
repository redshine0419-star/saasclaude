import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/messaging/send', () => ({ sendMessage: vi.fn() }));

const { betaNoticeBody } = await import('../owner-notice');

const t = { name: '하늘수학', slug: 'hanul-math', betaEndsAt: new Date('2026-12-31T15:00:00Z') };

describe('betaNoticeBody', () => {
  it('단계별 제목과 관리자 링크를 포함한다', () => {
    expect(betaNoticeBody('d14', t)).toContain('14일 남음');
    expect(betaNoticeBody('d3', t)).toContain('3일 남음');
    expect(betaNoticeBody('d0', t)).toContain('오늘 끝났습니다');
    expect(betaNoticeBody('unpublish7', t)).toContain('비공개로 전환됩니다 (7일 남음)');
    expect(betaNoticeBody('d14', t)).toContain('/hanul-math/admin');
  });
  it('종료일과 비공개 전환일을 한국 시간으로 표시한다', () => {
    const body = betaNoticeBody('d14', t);
    expect(body).toContain('2027년 1월 1일'); // 2026-12-31T15:00Z = KST 1월 1일 00시
    expect(body).toContain('2027년 1월 31일');
  });
});
