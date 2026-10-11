import type { DnsRecord } from './validate';

export type DomainState = {
  /** 도메인이 우리 프로젝트에 연결되고 DNS가 올바르게 가리키는지 */
  verified: boolean;
  /** 소유권 확인이 필요할 때 추가로 넣어야 할 TXT 레코드 */
  verification: DnsRecord[];
  misconfigured: boolean;
};

export interface DomainAdapter {
  add(domain: string): Promise<void>;
  check(domain: string): Promise<DomainState>;
  remove(domain: string): Promise<void>;
}

class VercelDomainAdapter implements DomainAdapter {
  private base = 'https://api.vercel.com';
  constructor(private token: string, private project: string, private teamId?: string) {}

  private url(path: string) {
    return `${this.base}${path}${this.teamId ? `?teamId=${encodeURIComponent(this.teamId)}` : ''}`;
  }

  private async call(path: string, init: RequestInit = {}) {
    const res = await fetch(this.url(path), {
      ...init,
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json', ...init.headers },
      cache: 'no-store',
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  }

  async add(domain: string) {
    const r = await this.call(`/v10/projects/${encodeURIComponent(this.project)}/domains`, { method: 'POST', body: JSON.stringify({ name: domain }) });
    // 이미 이 프로젝트에 추가된 도메인이면 그대로 진행
    if (!r.ok && r.body?.error?.code !== 'domain_already_in_use_by_project' && r.status !== 409) {
      throw new Error(r.body?.error?.code ?? `vercel_${r.status}`);
    }
  }

  async check(domain: string): Promise<DomainState> {
    const p = encodeURIComponent(this.project);
    const d = encodeURIComponent(domain);
    let info = await this.call(`/v9/projects/${p}/domains/${d}`);
    if (info.ok && !info.body.verified) {
      await this.call(`/v9/projects/${p}/domains/${d}/verify`, { method: 'POST' });
      info = await this.call(`/v9/projects/${p}/domains/${d}`);
    }
    const config = await this.call(`/v6/domains/${d}/config`);
    const verification: DnsRecord[] = Array.isArray(info.body?.verification)
      ? info.body.verification
          .filter((v: { type?: string }) => v.type === 'TXT')
          .map((v: { domain: string; value: string }) => ({ type: 'TXT' as const, name: v.domain, value: v.value }))
      : [];
    const misconfigured = config.ok ? !!config.body?.misconfigured : true;
    return { verified: !!info.body?.verified && !misconfigured, verification, misconfigured };
  }

  async remove(domain: string) {
    await this.call(`/v9/projects/${encodeURIComponent(this.project)}/domains/${encodeURIComponent(domain)}`, { method: 'DELETE' });
  }
}

/** 개발용: 추가 후 첫 확인은 미연결, 두 번째 확인부터 연결된 것으로 본다. */
class MockDomainAdapter implements DomainAdapter {
  private static checks = new Map<string, number>();
  async add(domain: string) { MockDomainAdapter.checks.set(domain, 0); }
  async check(domain: string): Promise<DomainState> {
    const n = (MockDomainAdapter.checks.get(domain) ?? 0) + 1;
    MockDomainAdapter.checks.set(domain, n);
    return { verified: n >= 2, verification: [], misconfigured: n < 2 };
  }
  async remove(domain: string) { MockDomainAdapter.checks.delete(domain); }
}

/** 운영 환경에서 Vercel 토큰이 없으면 null — 기능을 숨긴다(가짜 "연결됨" 방지). */
export function getDomainAdapter(): DomainAdapter | null {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  if (token && project) return new VercelDomainAdapter(token, project, process.env.VERCEL_TEAM_ID);
  if (process.env.NODE_ENV !== 'production') return new MockDomainAdapter();
  return null;
}
