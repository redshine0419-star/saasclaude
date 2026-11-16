import { describe, it, expect } from 'vitest';
import { normalizeEmail, maskEmailAddr, diagnosisText, renderDiagnosisMail } from '../result-mail';

const r = { id: 'abc123', academyName: '한울<수학>', area: '수원', subject: '수학' };
const scores = { homepage: { score: 1, note: '없음' }, seo: { score: 2 }, conversion: { score: 3 }, mobile: { score: 3 } };

describe('무료 진단 결과 메일', () => {
  it('이메일 형식을 확인하고 소문자로 다듬는다', () => {
    expect(normalizeEmail('  Owner@Example.COM ')).toBe('owner@example.com');
    expect(normalizeEmail('010-1234-5678')).toBeNull();
    expect(normalizeEmail('a@b')).toBeNull();
    expect(normalizeEmail('a b@c.com')).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
  it('목록에서는 가린다', () => {
    expect(maskEmailAddr('owner@example.com')).toBe('ow***@example.com');
  });
  it('결과 링크·항목·종합 평가가 들어간다', () => {
    const t = diagnosisText(r, scores, '', 'https://growweb.me');
    expect(t).toContain('https://growweb.me/consult/result/abc123');
    expect(t).toContain('• 홈페이지 현황: 미흡 — 없음');
    expect(t).toContain('종합 평가: 보통');
  });
  it('HTML은 이스케이프한다', () => {
    const m = renderDiagnosisMail(r, null, '', 'https://growweb.me');
    expect(m.html).toContain('한울&lt;수학&gt;');
    expect(m.html).not.toContain('<수학>');
    expect(m.subject).toContain('무료 진단 결과');
  });
});
