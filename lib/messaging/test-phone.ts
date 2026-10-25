/**
 * 테스트·샘플 데이터용 번호 (010-0000-xxxx, 미할당 국번).
 * 이 번호로는 실제 카카오·문자를 보내지 않는다 — 샘플 학원(scripts/seed-test2.mjs)이 자동 발송을 타도 안전하게.
 */
export function isTestPhone(phone: string | null | undefined): boolean {
  return !!phone && phone.replace(/\D/g, '').startsWith('0100000');
}
