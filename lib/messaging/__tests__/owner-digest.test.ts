import { describe, expect, it, vi, beforeEach } from 'vitest';

const db = {
  lead: { groupBy: vi.fn() },
  tenant: { findUnique: vi.fn() },
  adminNotification: { count: vi.fn() },
};
const notifyOwner = vi.fn();
vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/notify/owner', () => ({ notifyOwner }));

vi.stubEnv('MESSAGING_SECRET', 'test-secret');
const { oldestLabel, runOwnerDigest } = await import('../owner-digest');

const now = new Date('2026-10-15T23:05:00Z'); // KST 10월 16일 08:05

describe('oldestLabel', () => {
  it('KST 날짜 기준으로 표시한다', () => {
    expect(oldestLabel(new Date('2026-10-15T16:00:00Z'), now)).toBe('오늘 (10월 16일)'); // KST 16일 01시
    expect(oldestLabel(new Date('2026-10-15T14:00:00Z'), now)).toBe('어제 (10월 15일)'); // KST 15일 23시
    expect(oldestLabel(new Date('2026-10-12T03:00:00Z'), now)).toBe('4일 전 (10월 12일)');
  });
});

describe('runOwnerDigest', () => {
  beforeEach(() => {
    Object.values(db).forEach((m) => Object.values(m).forEach((f) => f.mockReset()));
    notifyOwner.mockReset();
    notifyOwner.mockResolvedValue({ pushed: 1, emailed: 0 });
    db.adminNotification.count.mockResolvedValue(0);
    db.lead.groupBy.mockResolvedValue([{ tenantId: 't1', _count: { _all: 3 }, _min: { createdAt: new Date('2026-10-14T01:00:00Z') } }]);
  });

  const tenant = (over: object = {}) => ({ id: 't1', slug: 'hanul', name: '하늘수학', automationSettings: [], ...over });

  it('학원별로 한 번, 건수만 담아 알림함·앱 알림으로 알린다 (카톡 아님)', async () => {
    db.tenant.findUnique.mockResolvedValue(tenant());
    const out = await runOwnerDigest(now);
    expect(out).toEqual([{ slug: 'hanul', count: 3, recipients: 0, sent: 1 }]);
    const [tid, n] = notifyOwner.mock.calls[0];
    expect(tid).toBe('t1');
    expect(n.kind).toBe('unanswered');
    expect(n.title).toContain('답하지 않은 상담 3건');
    expect(n.body).toContain('2일 전 (10월 14일)');
    expect(n.url).toBe('/hanul/admin/leads');
    expect(n.email).toBeFalsy();
    // 데모 학원 제외 조건이 쿼리에 있다
    expect(JSON.stringify(db.lead.groupBy.mock.calls[0][0].where)).toContain('"startsWith":"demo"');
  });

  it('원장이 끈 경우, 오늘 이미 알린 경우는 건너뛴다', async () => {
    db.tenant.findUnique.mockResolvedValueOnce(tenant({ automationSettings: [{ enabled: false }] }));
    expect(await runOwnerDigest(now)).toEqual([{ slug: 'hanul', skipped: 'disabled' }]);
    db.tenant.findUnique.mockResolvedValueOnce(tenant());
    db.adminNotification.count.mockResolvedValueOnce(1);
    expect(await runOwnerDigest(now)).toEqual([{ slug: 'hanul', skipped: 'already_sent' }]);
    expect(notifyOwner).not.toHaveBeenCalled();
  });
});
