import { describe, expect, it } from 'vitest';
import { betaStatus } from '../beta';

const DAY = 86400000;
const ends = new Date('2026-12-31T15:00:00Z');
const at = (offsetDays: number) => new Date(ends.getTime() + offsetDays * DAY);

describe('betaStatus', () => {
  it('14일 전보다 이르면 알림이 없다', () => {
    expect(betaStatus(ends, at(-20)).dueNotice).toBeNull();
  });
  it('단계별로 알림 키가 정해진다', () => {
    expect(betaStatus(ends, at(-14)).dueNotice).toBe('d14');
    expect(betaStatus(ends, at(-2)).dueNotice).toBe('d3');
    expect(betaStatus(ends, at(0)).dueNotice).toBe('d0');
    expect(betaStatus(ends, at(24)).dueNotice).toBe('unpublish7');
  });
  it('이미 보낸 알림은 다시 보내지 않고, 건너뛴 이전 단계도 보내지 않는다', () => {
    expect(betaStatus(ends, at(-2), { d3: 'x' }).dueNotice).toBeNull();
    // d14를 못 보낸 채 3일 전이 되면 d3만 보낸다
    expect(betaStatus(ends, at(-2), {}).dueNotice).toBe('d3');
  });
  it('비공개 전환 이후에는 알림이 없다', () => {
    expect(betaStatus(ends, at(31)).dueNotice).toBeNull();
  });
  it('남은 일수와 종료 여부', () => {
    const s = betaStatus(ends, at(-2.5));
    expect(s.daysLeft).toBe(3);
    expect(s.ended).toBe(false);
    expect(betaStatus(ends, at(1)).ended).toBe(true);
  });
});
