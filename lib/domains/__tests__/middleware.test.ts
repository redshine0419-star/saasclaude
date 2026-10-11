import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/domains/resolve', async (orig) => {
  const real = await orig<typeof import('../resolve')>();
  return { ...real, resolveSlugByHost: vi.fn(async (h: string) => (h === 'hanul-math.com' ? 'hanul-math' : null)) };
});

const { middleware } = await import('../../../middleware');

function req(url: string) {
  const u = new URL(url);
  return new NextRequest(url, { headers: { host: u.host } });
}

describe('custom domain routing', () => {
  it('루트를 학원 홈으로 rewrite', async () => {
    const res = await middleware(req('https://hanul-math.com/'));
    expect(res.headers.get('x-middleware-rewrite')).toBe('https://hanul-math.com/hanul-math');
  });
  it('하위 경로도 학원 경로로 rewrite', async () => {
    const res = await middleware(req('https://hanul-math.com/fee'));
    expect(res.headers.get('x-middleware-rewrite')).toBe('https://hanul-math.com/hanul-math/fee');
  });
  it('이미 slug로 시작하는 링크는 그대로 둔다', async () => {
    const res = await middleware(req('https://hanul-math.com/hanul-math/about'));
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(res.status).toBe(200);
  });
  it('관리자·로그인은 growweb.me로 보낸다', async () => {
    const a = await middleware(req('https://hanul-math.com/hanul-math/admin/leads'));
    expect(a.headers.get('location')).toBe('https://growweb.me/hanul-math/admin/leads');
    const b = await middleware(req('https://hanul-math.com/auth/signin'));
    expect(b.headers.get('location')).toBe('https://growweb.me/auth/signin');
  });
  it('연결 안 된 도메인과 플랫폼 도메인은 건드리지 않는다', async () => {
    const a = await middleware(req('https://unknown.com/'));
    expect(a.headers.get('x-middleware-rewrite')).toBeNull();
    const b = await middleware(req('https://growweb.me/demo-warm'));
    expect(b.headers.get('x-middleware-rewrite')).toBeNull();
  });
});
