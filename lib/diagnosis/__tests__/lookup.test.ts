import { describe, expect, it, vi } from 'vitest';

const lookup = vi.fn();
vi.mock('node:dns', () => ({ default: { lookup } }));

const { safeLookup } = await import('../safe-fetch');

function run(): Promise<{ err: NodeJS.ErrnoException | null; addr: unknown }> {
  return new Promise((resolve) => safeLookup('evil.example', {}, (err, addr) => resolve({ err, addr })));
}

describe('safeLookup', () => {
  it('공인 주소로 해석되는 도메인만 연결을 허용한다', async () => {
    lookup.mockImplementation((_h, _o, cb) => cb(null, [{ address: '93.184.216.34', family: 4 }]));
    const r = await run();
    expect(r.err).toBeNull();
    expect(r.addr).toBe('93.184.216.34');
  });

  it('하나라도 내부 주소로 해석되면 거부한다 (DNS 리바인딩 방어)', async () => {
    lookup.mockImplementation((_h, _o, cb) => cb(null, [{ address: '93.184.216.34', family: 4 }, { address: '127.0.0.1', family: 4 }]));
    const r = await run();
    expect(r.err?.code).toBe('EBLOCKED');
  });
});
