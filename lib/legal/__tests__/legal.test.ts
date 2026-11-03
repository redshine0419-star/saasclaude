import { describe, expect, it } from 'vitest';
import { CONSENT_VERSION, PRIVACY, SIGNUP_CONSENTS, TERMS } from '../documents';
import { safeNext } from '../consent';
import { academyPrivacy } from '../academy-privacy';

describe('회원가입 동의 항목', () => {
  it('필수 3개(만 14세·약관·개인정보)와 선택 마케팅을 나눈다', () => {
    expect(SIGNUP_CONSENTS.filter((c) => c.required).map((c) => c.key)).toEqual(['age', 'terms', 'privacy']);
    expect(SIGNUP_CONSENTS.find((c) => c.key === 'marketing')?.required).toBe(false);
  });
  it('개인정보 동의에는 항목·목적·보유 기간·거부 권리를 모두 적는다', () => {
    for (const key of ['privacy', 'marketing'] as const) {
      const c = SIGNUP_CONSENTS.find((x) => x.key === key)!;
      const heads = ('detail' in c ? c.detail : []).map(([k]) => k);
      expect(heads).toEqual(expect.arrayContaining([expect.stringMatching(/항목/), expect.stringMatching(/목적/), '보유 기간', '거부 권리']));
    }
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
