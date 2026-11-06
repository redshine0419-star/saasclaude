import { describe, expect, it } from 'vitest';
import { CONSENT_VERSION, PRIVACY, TERMS } from '../documents';
import { SIGNUP_CONSENTS, DIAGNOSIS_CONSENTS, billingConsents, consultConsents, requiredAgreed } from '../consents';
import { safeNext } from '../consent';
import { academyPrivacy } from '../academy-privacy';

describe('동의 항목', () => {
  it('회원가입: 필수 3개(만 14세·약관·개인정보)와 선택 2개(홍보 목적 수집·이용, 광고성 수신)', () => {
    expect(SIGNUP_CONSENTS.filter((c) => c.required).map((c) => c.key)).toEqual(['age', 'terms', 'privacy']);
    expect(SIGNUP_CONSENTS.filter((c) => !c.required).map((c) => c.key)).toEqual(['promo', 'ad']);
  });
  it('개인정보 수집·이용 동의는 항목·목적·보유 기간 표와 거부 안내를 갖는다', () => {
    const items = [...SIGNUP_CONSENTS, ...DIAGNOSIS_CONSENTS, ...consultConsents('테스트학원')].filter((c) => c.key === 'privacy' || c.key === 'promo');
    for (const c of items) {
      expect(c.table?.head).toEqual(['수집 항목', '이용 목적', '보유 기간']);
      expect(c.text?.join(' ')).toMatch(/거부/);
    }
  });
  it('제3자 제공 동의는 결제에만, 받는 자·목적·항목을 적는다', () => {
    const tp = billingConsents('자동결제').find((c) => c.key === 'thirdParty')!;
    expect(tp.required).toBe(true);
    expect(tp.table?.head[0]).toBe('제공받는 자');
    expect([...SIGNUP_CONSENTS, ...DIAGNOSIS_CONSENTS, ...consultConsents('x')].some((c) => c.key === 'thirdParty')).toBe(false);
  });
  it('필수 동의 검사', () => {
    const c = consultConsents('x');
    expect(requiredAgreed(c, { guardian: true, privacy: true })).toBe(true);
    expect(requiredAgreed(c, { privacy: true })).toBe(false);
  });
  it('문서 버전·필수 장이 있다', () => {
    expect(CONSENT_VERSION).toMatch(/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}/);
    const titles = PRIVACY.map((s) => s.title).join(' ');
    for (const w of ['처리 목적', '보유 기간', '위탁', '국외 이전', '파기', '권리', '보호책임자', '구제']) expect(titles).toContain(w);
    expect(TERMS.length).toBeGreaterThan(5);
  });
});

describe('safeNext / 학원 처리방침', () => {
  it('같은 사이트 경로만', () => {
    expect(safeNext('/start')).toBe('/start');
    expect(safeNext('//evil.com')).toBe('/start');
    expect(safeNext('https://evil.com')).toBe('/start');
    expect(safeNext(undefined, '/x')).toBe('/x');
  });
  it('학원 처리방침에 학원 이름·연락처, 퇴원 즉시 파기', () => {
    const s = academyPrivacy({ name: '하늘수학', phone: '02-000-0000', address: null, regNo: null });
    const text = JSON.stringify(s);
    expect(text).toContain('하늘수학');
    expect(text).toContain('02-000-0000');
    expect(text).toContain('퇴원 시 즉시 파기');
  });
});
