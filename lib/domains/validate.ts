// 플랫폼 자체 도메인과 그 하위 도메인은 학원이 쓸 수 없다.
export const PLATFORM_HOSTS = ['growweb.me'];

export function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '');
}

export function domainError(domain: string): string | null {
  if (!domain) return '도메인을 입력해 주세요.';
  if (domain.length > 253) return '도메인이 너무 깁니다.';
  const labels = domain.split('.');
  if (labels.length < 2) return '예: hanul-math.com 또는 www.hanul-math.com 형식으로 입력해 주세요.';
  if (!labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l))) {
    return '도메인에는 영문 소문자·숫자·하이픈만 쓸 수 있습니다. 한글 도메인은 퓨니코드(xn--)로 입력해 주세요.';
  }
  if (/^\d+$/.test(labels[labels.length - 1])) return 'IP 주소는 연결할 수 없습니다.';
  if (PLATFORM_HOSTS.some((h) => domain === h || domain.endsWith(`.${h}`)) || domain.endsWith('.vercel.app')) {
    return '사용할 수 없는 도메인입니다.';
  }
  return null;
}

/** 루트 도메인(hanul-math.com)이면 A 레코드, 하위 도메인(www.hanul-math.com)이면 CNAME. */
export function isApex(domain: string): boolean {
  return domain.split('.').length === 2 || /\.(co|or|ne|go|ac|re)\.kr$/.test(domain) && domain.split('.').length === 3;
}

export type DnsRecord = { type: 'A' | 'CNAME' | 'TXT'; name: string; value: string };

export function requiredDnsRecords(domain: string): DnsRecord[] {
  return isApex(domain)
    ? [{ type: 'A', name: '@', value: '76.76.21.21' }]
    : [{ type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com' }];
}
