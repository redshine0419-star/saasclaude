// 서버·브라우저의 로캘 데이터 차이로 결과가 달라지지 않게 KST 기준으로 직접 만든다 (hydration 불일치 방지)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function parts(input: Date | string) {
  const d = new Date(new Date(input).getTime() + KST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { y: d.getUTCFullYear(), m: pad(d.getUTCMonth() + 1), d: pad(d.getUTCDate()), hh: pad(d.getUTCHours()), mm: pad(d.getUTCMinutes()) };
}

/** 2026.10.15 */
export function formatKstDate(input: Date | string): string {
  const p = parts(input);
  return `${p.y}.${p.m}.${p.d}`;
}

/** 2026.10.15 12:37 */
export function formatKstDateTime(input: Date | string): string {
  const p = parts(input);
  return `${p.y}.${p.m}.${p.d} ${p.hh}:${p.mm}`;
}

/** 오늘(KST) YYYY-MM-DD — 출결 등 날짜만 다루는 칸의 기본값 */
export function kstToday(now: Date = new Date()): string {
  const p = parts(now);
  return `${p.y}-${p.m}-${p.d}`;
}

/** DB date 칼럼(UTC 자정) → YYYY-MM-DD */
export function dateOnlyString(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

/** 지금부터 n일 전 시각 */
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
