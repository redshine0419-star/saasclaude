/**
 * 무료 기간 이벤트 (2026-11-17)
 *  - feedback: 더클을 써 보고 개선 제안을 보내면 1개월 무료
 *  - blog: 블로그에 더클 소개 글을 공개로 올리면 3개월 무료
 * 학원당 이벤트마다 한 번. 운영자가 확인(승인)하면 무료 종료일을 늦추고, 유료 결제 중이면 다음 결제일을 늦춘다.
 * 블로그 글은 대가(무료 이용)를 받고 쓰는 글이라 그 사실을 글에 밝혀야 한다
 * (표시·광고의 공정화에 관한 법률 — 추천·보증 등에 관한 표시·광고 심사지침). 신청할 때 서버에서 확인을 받는다.
 */

export type EventKind = 'feedback' | 'blog';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export const EVENTS: Record<EventKind, { title: string; months: number; short: string }> = {
  feedback: { title: '개선 제안 보내기', months: 1, short: '더클을 써 보고 불편한 점이나 바라는 기능을 보내 주세요.' },
  blog: { title: '블로그 소개글 올리기', months: 3, short: '블로그에 더클을 소개하는 글을 전체 공개로 올리고 주소를 보내 주세요.' },
};

export const FEEDBACK_MIN = 30;
export const FEEDBACK_MAX = 3000;
/** 블로그 글에 넣을 대가 표시 예시 */
export const DISCLOSURE_EXAMPLE = '이 글은 더클로부터 무료 이용 혜택을 받고 작성했습니다.';

export const isEventKind = (k: unknown): k is EventKind => k === 'feedback' || k === 'blog';

export type ClaimInput =
  | { kind: 'feedback'; content: string }
  | { kind: 'blog'; url: string; disclosure: true };

/** 원장 신청 검사 — 통과하면 저장할 값, 아니면 오류 문구 */
export function parseClaimInput(raw: unknown): { ok: true; data: ClaimInput } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (!isEventKind(r.kind)) return { ok: false, error: '이벤트 종류가 올바르지 않습니다.' };
  if (r.kind === 'feedback') {
    const content = typeof r.content === 'string' ? r.content.trim() : '';
    if (content.length < FEEDBACK_MIN) return { ok: false, error: `개선 제안을 ${FEEDBACK_MIN}자 이상 적어 주세요.` };
    return { ok: true, data: { kind: 'feedback', content: content.slice(0, FEEDBACK_MAX) } };
  }
  const url = typeof r.url === 'string' ? r.url.trim() : '';
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, error: '블로그 글 주소를 https:// 로 시작하는 전체 주소로 넣어 주세요.' };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, error: '블로그 글 주소가 올바르지 않습니다.' };
  if (/(^|\.)growweb\.me$/i.test(u.hostname)) return { ok: false, error: '더클 홈페이지가 아닌 블로그 글 주소를 넣어 주세요.' };
  if (r.ownPublic !== true) return { ok: false, error: '직접 쓴 글을 전체 공개로 올렸는지 확인해 주세요.' };
  // 법적 요건: 대가를 받은 글이라는 표시 — 확인 없이는 접수하지 않는다
  if (r.disclosure !== true) return { ok: false, error: `글에 "${DISCLOSURE_EXAMPLE}"처럼 혜택을 받았다는 문구를 넣고 확인해 주세요.` };
  if (r.noPersonal !== true) return { ok: false, error: '글에 학생 이름·얼굴 등 개인정보가 없는지 확인해 주세요.' };
  return { ok: true, data: { kind: 'blog', url: u.toString().slice(0, 500), disclosure: true } };
}

/** 이미 받았거나 확인 중인 신청이 있으면 새로 낼 수 없다 (반려된 것만 다시 낼 수 있다) */
export function canSubmit(existing: { kind: string; status: string }[], kind: EventKind): { ok: true } | { ok: false; error: string } {
  const mine = existing.filter((c) => c.kind === kind);
  if (mine.some((c) => c.status === 'approved')) return { ok: false, error: '이 이벤트는 이미 혜택을 받으셨습니다.' };
  if (mine.some((c) => c.status === 'pending')) return { ok: false, error: '확인 중인 신청이 있습니다. 결과를 기다려 주세요.' };
  return { ok: true };
}

/** 날짜에 개월 수를 더한다 (말일 보정: 1/31 + 1개월 = 2/28) */
export function addMonths(d: Date, months: number): Date {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + months);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}

export type ExtensionPlan =
  | { target: 'subscription'; from: Date; until: Date }
  | { target: 'beta'; from: Date; until: Date };

/**
 * 승인할 때 무엇을 얼마나 늦출지.
 * 정기결제가 살아 있으면(active·past_due) 다음 결제일을, 아니면 무료(베타) 종료일을 늦춘다.
 * 무료 기간이 이미 끝났으면 오늘부터 센다.
 */
export function planExtension(
  t: { planStatus: string; betaEndsAt: Date | null },
  sub: { status: string; nextBillingAt: Date } | null,
  months: number,
  now: Date,
): ExtensionPlan {
  if (sub && sub.status !== 'canceled' && t.planStatus === 'paid') {
    return { target: 'subscription', from: sub.nextBillingAt, until: addMonths(sub.nextBillingAt, months) };
  }
  const base = t.betaEndsAt && t.betaEndsAt > now ? t.betaEndsAt : now;
  return { target: 'beta', from: base, until: addMonths(base, months) };
}

/** 무료 종료일이 바뀌면 종료 안내(2주 전·3일 전·당일·비공개 7일 전)를 새 날짜 기준으로 다시 보내도록 기록을 지운다 */
export function resetBetaNotices(notices: unknown): Record<string, unknown> {
  const prev = { ...((notices ?? {}) as Record<string, unknown>) };
  for (const k of ['d14', 'd3', 'd0', 'unpublish7']) delete prev[k];
  return prev;
}
