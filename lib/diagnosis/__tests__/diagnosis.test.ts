import { describe, expect, it } from 'vitest';
import { analyzePage } from '../analyze';
import { checkUrl, isBlockedIp } from '../safe-fetch';

describe('SSRF 방어', () => {
  it('내부·예약 주소를 막는다', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isBlockedIp(ip), ip).toBe(true);
    }
  });
  it('공인 주소는 허용한다', () => {
    expect(isBlockedIp('223.130.200.104')).toBe(false);
    expect(isBlockedIp('2404:6800:4004:80c::200e')).toBe(false);
  });
  it('위험한 URL 형식을 거부한다', () => {
    for (const u of ['file:///etc/passwd', 'http://localhost/', 'http://user:pw@example.com', 'http://example.com:8080/', 'http://127.0.0.1/', 'http://[::1]/', 'gopher://x']) {
      expect(() => checkUrl(u), u).toThrow();
    }
  });
  it('스킴이 없으면 https로 해석한다', () => {
    expect(checkUrl('example.com').toString()).toBe('https://example.com/');
  });
});

describe('analyzePage', () => {
  const good = `<!doctype html><html><head>
    <title>하늘수학학원 | 강남 중고등 수학</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="강남 역삼동 수학학원">
    <meta property="og:title" content="하늘수학학원">
    <meta name="naver-site-verification" content="abc">
    <script type="application/ld+json">{"@type":"EducationalOrganization"}</script>
  </head><body>
    <a href="tel:0212345678">02-1234-5678</a> 서울시 강남구 역삼동 123
    교습비 안내 · 학원등록번호 제2024-서울강남-0001호
    <form><button>상담 신청</button></form><a href="https://pf.kakao.com/_x">카톡</a>
  </body></html>`;

  it('잘 갖춘 페이지는 모두 양호', () => {
    const r = analyzePage({ finalUrl: 'https://hanul.example/', html: good, ms: 400, bytes: 20_000 });
    expect(r.kind).toBe('homepage');
    for (const k of ['homepage', 'seo', 'conversion', 'mobile'] as const) expect(r.items[k].score, k).toBe(3);
  });

  it('빈 페이지는 미흡하고 개선 팁을 준다', () => {
    const r = analyzePage({ finalUrl: 'http://old.example/', html: '<html><body>안녕하세요</body></html>', ms: 3000, bytes: 1000 });
    expect(r.items.conversion.score).toBe(1);
    expect(r.items.seo.score).toBe(1);
    expect(r.items.conversion.note).toContain('전화 버튼');
  });

  it('블로그·플레이스 주소는 홈페이지 없음으로 본다', () => {
    const r = analyzePage({ finalUrl: 'https://m.blog.naver.com/hanul', html: good, ms: 100, bytes: 100 });
    expect(r.kind).toBe('platform_page');
    expect(r.platform).toBe('네이버 블로그');
  });
});
