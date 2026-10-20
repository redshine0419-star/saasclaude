// 풀이 사진 위 펜 표시: 사진 크기와 무관한 0~1 좌표의 선 묶음(JSON). SVG로 사진 위에 겹쳐 그린다.

export type Stroke = { color: string; points: [number, number][] };

export const MARK_COLORS = ['#E11D48', '#2563EB', '#16A34A'];
const MAX_STROKES = 300;
const MAX_POINTS = 2000;

/** 저장된 문자열 → 선 목록. 형식이 틀리면 빈 목록 */
export function parseMarks(raw: string | null | undefined): Stroke[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return validateStrokes(v) ?? [];
  } catch {
    return [];
  }
}

/** 클라이언트가 보낸 값을 검증한다. 문제가 있으면 null */
export function validateStrokes(v: unknown): Stroke[] | null {
  if (!Array.isArray(v) || v.length > MAX_STROKES) return null;
  const out: Stroke[] = [];
  for (const s of v) {
    if (!s || typeof s !== 'object') return null;
    const { color, points } = s as { color?: unknown; points?: unknown };
    if (typeof color !== 'string' || !MARK_COLORS.includes(color)) return null;
    if (!Array.isArray(points) || points.length < 1 || points.length > MAX_POINTS) return null;
    const pts: [number, number][] = [];
    for (const p of points) {
      if (!Array.isArray(p) || p.length !== 2) return null;
      const [x, y] = p.map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return null;
      pts.push([Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]);
    }
    out.push({ color, points: pts });
  }
  return out;
}

export function strokePath(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
}
