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
