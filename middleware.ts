import { NextRequest, NextResponse } from 'next/server';

function detectLang(pathname: string, host: string): string {
  if (host.startsWith('en.')) return 'en';
  if (host.startsWith('ja.')) return 'ja';
  if (pathname.startsWith('/blog/ko') || pathname.startsWith('/ko')) return 'ko';
  if (pathname.startsWith('/blog/en') || pathname.startsWith('/en')) return 'en';
  if (pathname.startsWith('/blog/ja') || pathname.startsWith('/ja')) return 'ja';
  return 'ko';
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const host = req.headers.get('host') ?? '';
  const country = req.headers.get('x-vercel-ip-country') ?? '';
  const ua = req.headers.get('user-agent') ?? '';

  const isBot = /Googlebot|AdsBot-Google|Mediapartners-Google|Google-InspectionTool|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|facebookexternalhit/i.test(ua);
  const isEnSubdomain = host.startsWith('en.');
  const isJaSubdomain = host.startsWith('ja.');

  // 루트(/) 방문 시 국가별 서브도메인 리다이렉트 (봇·서브도메인 방문은 제외)
  if (!isBot && !isEnSubdomain && !isJaSubdomain && pathname === '/') {
    const rootHost = host.replace(/^www\./, '');
    if (country === 'JP') {
      const url = req.nextUrl.clone();
      url.hostname = `ja.${rootHost}`;
      return NextResponse.redirect(url);
    }
    if (country !== '' && country !== 'KR') {
      const url = req.nextUrl.clone();
      url.hostname = `en.${rootHost}`;
      return NextResponse.redirect(url);
    }
  }

  // x-lang 헤더를 통해 루트 레이아웃에 언어 전달
  const lang = detectLang(pathname, host);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-lang', lang);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next|favicon|sitemap|robots).*)'],
};
