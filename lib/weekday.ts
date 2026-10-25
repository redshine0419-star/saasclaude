// 브라우저 컴포넌트에서도 쓰는 요일 표기 — DB 모듈(lib/academy-data → lib/prisma)을 끌어오지 않게 따로 둔다
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function weekdayLabel(n: number): string {
  return WEEKDAYS[n] ?? '';
}
