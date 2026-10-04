import { describe, it, expect } from 'vitest';
import { applyRules, isNightTime, nextMorning } from '../rules';
import type { SendRequest } from '../types';

// ─── 픽스처 헬퍼 ──────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<SendRequest> = {}): SendRequest {
  return {
    tenantId: 'tenant-1',
    recipientId: 'lead-1',
    recipientHash: 'abc123',
    phone: '01012345678',
    kind: 'campaign',
    body: '2학기 특강 모집 안내',
    isAdvertisement: true,
    consent: { marketing: true, night: false },
    requestedAt: kst(14, 0), // 오후 2시 (야간 아님)
    ...overrides,
  };
}

/** UTC Date를 KST hh:mm으로 생성한다 */
function kst(hour: number, minute = 0): Date {
  // KST = UTC + 9h
  return new Date(Date.UTC(2026, 9, 5, hour - 9, minute)); // Oct 5
}

// ─── 규칙 1: 마케팅 동의 ──────────────────────────────────────────────────────

describe('규칙 1 — 광고성 메시지는 marketing 동의 대상만', () => {
  it('마케팅 동의 없는 수신자에게 광고성 발송 시도 → rejected', () => {
    const result = applyRules(makeReq({ consent: { marketing: false, night: false } }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('no_marketing_consent');
    }
  });

  it('마케팅 동의한 수신자에게 광고성 발송 → ok', () => {
    const result = applyRules(makeReq({ consent: { marketing: true, night: false } }));
    expect(result.ok).toBe(true);
  });

  it('정보성 메시지는 marketing 동의 없어도 발송 → ok', () => {
    const result = applyRules(
      makeReq({
        kind: 'receipt',
        isAdvertisement: false,
        consent: { marketing: false, night: false },
      }),
    );
    expect(result.ok).toBe(true);
  });
});

// ─── 규칙 2: (광고) 접두사 + 수신거부 문구 ───────────────────────────────────

describe('규칙 2 — 광고성 본문에 (광고) 접두사와 수신거부 문구 자동 삽입', () => {
  it('광고성 메시지 본문 앞에 (광고) 가 삽입된다', () => {
    const result = applyRules(makeReq({ body: '겨울 특강 모집 안내' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body).toMatch(/^\(광고\) /);
    }
  });

  it('광고성 메시지 본문 끝에 수신거부 문구가 삽입된다', () => {
    const result = applyRules(makeReq({ body: '겨울 특강 모집 안내' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body).toContain('수신거부: 카카오 채널 차단');
    }
  });

  it('(광고) 가 이미 있으면 중복 삽입하지 않는다', () => {
    const result = applyRules(makeReq({ body: '(광고) 이미 있는 경우' }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const count = (result.body.match(/\(광고\)/g) ?? []).length;
      expect(count).toBe(1);
    }
  });

  it('정보성 메시지에는 (광고) 를 삽입하지 않는다', () => {
    const result = applyRules(
      makeReq({
        kind: 'receipt',
        isAdvertisement: false,
        body: '상담 접수가 완료되었습니다',
        consent: { marketing: true, night: false },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body).not.toContain('(광고)');
      expect(result.body).not.toContain('수신거부');
    }
  });
});

// ─── 규칙 3: 야간 제한 (21:00~08:00 KST) ─────────────────────────────────────

describe('규칙 3 — 야간 광고성 메시지는 night 미동의자에게 다음날 08:00 KST로 미룬다', () => {
  it('21:00 이후 광고성 + night 미동의 → scheduledAt이 다음날 08:00 KST', () => {
    const result = applyRules(
      makeReq({
        requestedAt: kst(21, 30), // KST 21:30
        consent: { marketing: true, night: false },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const kstHour = getKSTHour(result.scheduledAt);
      const isNextDay = result.scheduledAt > kst(21, 30);
      expect(kstHour).toBe(8);
      expect(isNextDay).toBe(true);
    }
  });

  it('자정(00:30) 광고성 + night 미동의 → 당일 08:00 KST로 미룬다', () => {
    const result = applyRules(
      makeReq({
        requestedAt: kst(0, 30), // KST 00:30
        consent: { marketing: true, night: false },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(getKSTHour(result.scheduledAt)).toBe(8);
    }
  });

  it('21:30 광고성 + night 동의 → 즉시 발송(scheduledAt = requestedAt)', () => {
    const requestedAt = kst(21, 30);
    const result = applyRules(
      makeReq({
        requestedAt,
        consent: { marketing: true, night: true },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.scheduledAt.getTime()).toBe(requestedAt.getTime());
    }
  });

  it('14:00 광고성 + night 미동의 → 야간 아니므로 즉시 발송', () => {
    const requestedAt = kst(14, 0);
    const result = applyRules(
      makeReq({
        requestedAt,
        consent: { marketing: true, night: false },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.scheduledAt.getTime()).toBe(requestedAt.getTime());
    }
  });

  it('정보성 메시지는 야간에도 즉시 발송 (night 제한 없음)', () => {
    const requestedAt = kst(23, 0);
    const result = applyRules(
      makeReq({
        kind: 'reminder',
        isAdvertisement: false,
        requestedAt,
        consent: { marketing: false, night: false },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.scheduledAt.getTime()).toBe(requestedAt.getTime());
    }
  });
});

// ─── 보조 함수 테스트 ──────────────────────────────────────────────────────────

describe('isNightTime — KST 야간 판정', () => {
  it('KST 21:00 → 야간', () => expect(isNightTime(kst(21, 0))).toBe(true));
  it('KST 23:59 → 야간', () => expect(isNightTime(kst(23, 59))).toBe(true));
  it('KST 00:00 → 야간', () => expect(isNightTime(kst(0, 0))).toBe(true));
  it('KST 07:59 → 야간', () => expect(isNightTime(kst(7, 59))).toBe(true));
  it('KST 08:00 → 주간', () => expect(isNightTime(kst(8, 0))).toBe(false));
  it('KST 14:00 → 주간', () => expect(isNightTime(kst(14, 0))).toBe(false));
  it('KST 20:59 → 주간', () => expect(isNightTime(kst(20, 59))).toBe(false));
});

describe('nextMorning — 다음 08:00 KST 계산', () => {
  it('KST 21:30 → 다음날 08:00 KST', () => {
    const result = nextMorning(kst(21, 30));
    expect(getKSTHour(result)).toBe(8);
    // 날짜가 하루 뒤
    const inputDay = new Date(kst(21, 30).getTime() + 9 * 3600 * 1000).getUTCDate();
    const resultDay = new Date(result.getTime() + 9 * 3600 * 1000).getUTCDate();
    expect(resultDay).toBe(inputDay + 1);
  });

  it('KST 00:30 → 당일 08:00 KST (같은 날 미룸)', () => {
    const result = nextMorning(kst(0, 30));
    expect(getKSTHour(result)).toBe(8);
    const inputDay = new Date(kst(0, 30).getTime() + 9 * 3600 * 1000).getUTCDate();
    const resultDay = new Date(result.getTime() + 9 * 3600 * 1000).getUTCDate();
    expect(resultDay).toBe(inputDay);
  });
});

// ─── 헬퍼 ───────────────────────────────────────────────────────────────────

function getKSTHour(date: Date): number {
  return new Date(date.getTime() + 9 * 3600 * 1000).getUTCHours();
}
