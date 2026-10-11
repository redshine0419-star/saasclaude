import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import type { LookupFunction } from 'node:net';

// 사용자가 입력한 URL을 서버에서 가져오므로 내부망 접근(SSRF)을 막는다.

const BLOCKED_V4: [string, number][] = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
];

function v4ToInt(ip: string) {
  return ip.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const n = v4ToInt(ip);
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (v4ToInt(base) & mask);
    });
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIp(mapped[1]);
    return (
      lower === '::' || lower === '::1' ||
      lower.startsWith('fc') || lower.startsWith('fd') ||           // fc00::/7 고유 로컬
      /^fe[89ab]/.test(lower) ||                                    // fe80::/10 링크 로컬
      lower.startsWith('ff') ||                                     // 멀티캐스트
      lower.startsWith('64:ff9b:') || lower.startsWith('2001:db8') // NAT64, 문서용
    );
  }
  return true;
}

export const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 4);
    const list = addresses as dns.LookupAddress[];
    const bad = list.find((a) => isBlockedIp(a.address));
    if (bad || list.length === 0) {
      return callback(Object.assign(new Error('blocked_address'), { code: 'EBLOCKED' }), '', 4);
    }
    if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

export class FetchBlockedError extends Error {}

export function checkUrl(raw: string): URL {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) throw new FetchBlockedError('bad_protocol');
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new FetchBlockedError('invalid_url');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new FetchBlockedError('bad_protocol');
  if (url.username || url.password) throw new FetchBlockedError('credentials');
  if (url.port && url.port !== '80' && url.port !== '443') throw new FetchBlockedError('bad_port');
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, '')) && isBlockedIp(url.hostname.replace(/^\[|\]$/g, ''))) {
    throw new FetchBlockedError('blocked_address');
  }
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(url.hostname)) throw new FetchBlockedError('blocked_host');
  return url;
}

export type SafeFetchResult = {
  finalUrl: string;
  status: number;
  html: string;
  bytes: number;
  ms: number;
};

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

function requestOnce(url: URL, deadline: number): Promise<{ status: number; location?: string; body: string; bytes: number; type: string }> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(
      url,
      {
        method: 'GET',
        lookup: safeLookup,
        headers: { 'User-Agent': 'GrowwebDiagnosis/1.0 (+https://growweb.me)', Accept: 'text/html' },
        timeout: Math.max(1, deadline - Date.now()),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const type = String(res.headers['content-type'] ?? '');
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ status, location: res.headers.location, body: '', bytes: 0, type });
        }
        const chunks: Buffer[] = [];
        let bytes = 0;
        res.on('data', (c: Buffer) => {
          bytes += c.length;
          if (bytes > MAX_BYTES) { req.destroy(); return; }
          chunks.push(c);
        });
        res.on('end', () => resolve({ status, body: Buffer.concat(chunks).toString('utf8'), bytes, type }));
        res.on('close', () => resolve({ status, body: Buffer.concat(chunks).toString('utf8'), bytes, type }));
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

export async function safeFetchHtml(raw: string): Promise<SafeFetchResult> {
  const started = Date.now();
  const deadline = started + TIMEOUT_MS;
  let url = checkUrl(raw);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const r = await requestOnce(url, deadline);
    if (r.location) {
      url = checkUrl(new URL(r.location, url).toString());
      continue;
    }
    if (r.type && !/html|text\/plain/i.test(r.type)) throw new FetchBlockedError('not_html');
    return { finalUrl: url.toString(), status: r.status, html: r.body, bytes: r.bytes, ms: Date.now() - started };
  }
  throw new FetchBlockedError('too_many_redirects');
}
