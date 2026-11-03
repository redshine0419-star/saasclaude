/** 정기결제 날짜 계산 — 순수 함수(테스트 가능) */

export const MAX_RETRIES = 3;

/** 한 달 뒤 같은 날 (31일 → 다음 달 말일) */
export function addMonth(d: Date): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last), d.getUTCHours(), d.getUTCMinutes()));
}

/** 첫 결제일: 베타 중이면 베타 종료일, 아니면 지금 */
export function firstBillingAt(now: Date, planStatus: string, betaEndsAt: Date | null): Date {
  return planStatus === 'beta' && betaEndsAt && betaEndsAt > now ? betaEndsAt : now;
}

/** 실패 후: 재시도 횟수가 남았으면 다음 날 다시, 아니면 null(재시도 중단) */
export function retryAt(now: Date, failCount: number): Date | null {
  return failCount < MAX_RETRIES ? new Date(now.getTime() + 24 * 3600 * 1000) : null;
}
