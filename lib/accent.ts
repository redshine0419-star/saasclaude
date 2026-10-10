// 강조색은 흰 글자 버튼 배경으로 쓰이므로 흰색 대비 4.5:1 이상만 허용한다 (WCAG AA).
export const MIN_CONTRAST = 4.5;

export const ACCENT_PRESETS = [
  { hex: '#1E5645', label: '칠판 녹색' },
  { hex: '#1D3FA8', label: '진한 파랑' },
  { hex: '#0F766E', label: '청록' },
  { hex: '#7C2D12', label: '벽돌' },
  { hex: '#6D28D9', label: '보라' },
  { hex: '#B42318', label: '빨강' },
  { hex: '#14213D', label: '남색' },
  { hex: '#4D5B12', label: '올리브' },
];

function channel(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function contrastWithWhite(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return 1.05 / (l + 0.05);
}

/** 문제가 없으면 null, 있으면 사용자에게 보여줄 메시지. 빈 값은 테마 기본색 사용으로 허용. */
export function accentError(hex: string): string | null {
  if (!hex) return null;
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return '올바른 색상 코드(#RRGGBB)를 입력해 주세요.';
  if (contrastWithWhite(hex) < MIN_CONTRAST) return '너무 밝은 색입니다. 버튼 글자가 잘 보이도록 더 진한 색을 골라 주세요.';
  return null;
}
