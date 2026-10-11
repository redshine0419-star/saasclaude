// 베타 기간 계산 (SPEC 10장): 오픈일부터 3개월, 종료 후 30일 유지 뒤 비공개.
export const BETA_GRACE_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export type BetaNoticeKey = 'd14' | 'd3' | 'd0' | 'unpublish7';

// 늦은 단계가 앞에 오도록 정렬 — 한 번에 하나만(가장 최근 단계) 보낸다
const NOTICE_THRESHOLDS: { key: BetaNoticeKey; dueAt: (endsAt: Date) => Date }[] = [
  { key: 'unpublish7', dueAt: (e) => new Date(e.getTime() + (BETA_GRACE_DAYS - 7) * DAY) },
  { key: 'd0', dueAt: (e) => e },
  { key: 'd3', dueAt: (e) => new Date(e.getTime() - 3 * DAY) },
  { key: 'd14', dueAt: (e) => new Date(e.getTime() - 14 * DAY) },
];

export type BetaStatus = {
  endsAt: Date;
  unpublishAt: Date;
  /** 종료까지 남은 일수(올림). 종료 후에는 0 이하 */
  daysLeft: number;
  ended: boolean;
  /** 지금 보내야 할(아직 안 보낸) 알림 */
  dueNotice: BetaNoticeKey | null;
};

export function betaStatus(endsAt: Date, now: Date, sent: Partial<Record<BetaNoticeKey, string>> = {}): BetaStatus {
  const unpublishAt = new Date(endsAt.getTime() + BETA_GRACE_DAYS * DAY);
  const latestDue = NOTICE_THRESHOLDS.find((n) => now >= n.dueAt(endsAt));
  return {
    endsAt,
    unpublishAt,
    daysLeft: Math.ceil((endsAt.getTime() - now.getTime()) / DAY),
    ended: now >= endsAt,
    dueNotice: latestDue && !sent[latestDue.key] && now < unpublishAt ? latestDue.key : null,
  };
}

export function formatKstDate(d: Date): string {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}
