import { describe, expect, it } from 'vitest';
import { domainError, normalizeDomain, requiredDnsRecords } from '../validate';

describe('domain validation', () => {
  it('입력을 정규화한다', () => {
    expect(normalizeDomain(' https://WWW.Hanul-Math.com/about ')).toBe('www.hanul-math.com');
  });
  it('정상 도메인은 통과', () => {
    for (const d of ['hanul-math.com', 'www.hanul-math.com', 'hanul.co.kr', 'xn--hj2bx6b.com']) expect(domainError(d), d).toBeNull();
  });
  it('잘못된·금지된 도메인은 거부', () => {
    for (const d of ['', 'localhost', 'hanul', '하늘.com', '-bad.com', '1.2.3.4', 'growweb.me', 'x.growweb.me', 'foo.vercel.app']) {
      expect(domainError(d), d).not.toBeNull();
    }
  });
  it('루트는 A, 하위 도메인은 CNAME 안내', () => {
    expect(requiredDnsRecords('hanul-math.com')[0].type).toBe('A');
    expect(requiredDnsRecords('hanul.co.kr')[0].type).toBe('A');
    expect(requiredDnsRecords('www.hanul-math.com')[0]).toEqual({ type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' });
  });
});
