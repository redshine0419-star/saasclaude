import { describe, expect, it } from 'vitest';
import { isRegToken, newRegToken, parseRegistration, registrationCutoff, REGISTRATION_TTL_DAYS } from '../registration';

const ok = { studentName: ' 김하늘 ', grade: '중2', parentName: '김엄마', parentPhone: '010-1234-5678', guardianConfirmed: true, consentAgreed: true };

describe('parseRegistration', () => {
  it('정상 입력을 다듬어 돌려준다', () => {
    const r = parseRegistration(ok);
    expect(r.ok && r.data.studentName).toBe('김하늘');
    expect(r.ok && r.data.school).toBeNull();
  });
  it('동의·학부모 확인 없으면 거절', () => {
    expect(parseRegistration({ ...ok, consentAgreed: false }).ok).toBe(false);
    expect(parseRegistration({ ...ok, guardianConfirmed: undefined }).ok).toBe(false);
  });
  it('필수 칸과 전화번호 형식을 검사한다', () => {
    expect(parseRegistration({ ...ok, studentName: '' }).ok).toBe(false);
    expect(parseRegistration({ ...ok, parentPhone: 'abc' }).ok).toBe(false);
    expect(parseRegistration({ ...ok, studentPhone: '12' }).ok).toBe(false);
  });
});

describe('등록 토큰', () => {
  it('새 토큰은 형식 검사를 통과한다', () => {
    expect(isRegToken(newRegToken())).toBe(true);
    expect(isRegToken('short')).toBe(false);
  });
  it('보관 기한', () => {
    const now = new Date('2026-11-05T00:00:00Z');
    expect(now.getTime() - registrationCutoff(now).getTime()).toBe(REGISTRATION_TTL_DAYS * 86400000);
  });
});
