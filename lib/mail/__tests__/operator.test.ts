import { describe, expect, it } from 'vitest';
import { maskPhoneForMail, parseRecipients, renderOperatorMail } from '../operator';

describe('maskPhoneForMail', () => {
  it('휴대폰·지역번호를 가린다', () => {
    expect(maskPhoneForMail('010-1234-5678')).toBe('010-****-5678');
    expect(maskPhoneForMail('0212345678')).toBe('021-***-5678');
  });
  it('형식이 낯설어도 원문을 내보내지 않는다', () => {
    expect(maskPhoneForMail('+82 10 1234 5678')).toBe('****-5678');
    expect(maskPhoneForMail('12')).toBe('****');
  });
});

describe('renderOperatorMail', () => {
  it('입력값을 HTML 이스케이프하고 링크를 붙인다', () => {
    const { html, text } = renderOperatorMail(
      { subject: 's', heading: '신청', rows: [['학원명', '<b>한울</b>']], linkPath: '/platform/diagnosis', linkLabel: '보기' },
      'https://growweb.me/',
    );
    expect(html).toContain('&lt;b&gt;한울&lt;/b&gt;');
    expect(html).not.toContain('<b>한울');
    expect(text).toContain('보기: https://growweb.me/platform/diagnosis');
  });
});

describe('parseRecipients', () => {
  it('여러 입력 형식에서 주소를 찾는다', () => {
    expect(parseRecipients('a@example.com')).toEqual(['a@example.com']);
    expect(parseRecipients('"a@example.com"')).toEqual(['a@example.com']);
    expect(parseRecipients('운영자 <A@Example.com>; b@example.com, a@example.com')).toEqual(['a@example.com', 'b@example.com']);
    expect(parseRecipients('')).toEqual([]);
    expect(parseRecipients(undefined)).toEqual([]);
    expect(parseRecipients('not-an-email')).toEqual([]);
  });
});
