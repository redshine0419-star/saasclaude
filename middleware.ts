import { NextRequest, NextResponse } from 'next/server';

function detectLang(pathname: string): string {
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

  // www → non-www 리디렉션 (next.config.ts redirects가 먼저 처리되지만 안전망)
  if (host.startsWith('www.')) {
    const url = req.nextUrl.clone();
    url.host = host.replace(/^www\./, '');
    return NextResponse.redirect(url, { status: 301 });
  }

  // 검색 봇은 국가 리다이렉트 제외 (Google, Bing, 기타 주요 크롤러)
  const isBot = /Googlebot|AdsBot-Google|Mediapartners-Google|Google-InspectionTool|bingbot|Baiduspider|YandexBot|DuckDuckBot|Slurp|facebookexternalhit/i.test(ua);
  if (!isBot) {
    // 국가 기반 리다이렉트 — 이미 해당 로케일 경로에 있으면 skip
    if (country === 'JP' && !pathname.startsWith('/ja')) {
      const url = req.nextUrl.clone();
      url.pathname = '/ja';
      return NextResponse.redirect(url);
    }
    if (country !== '' && country !== 'KR' && country !== 'JP'
        && !pathname.startsWith('/en') && !pathname.startsWith('/ja')) {
      const url = req.nextUrl.clone();
      url.pathname = '/en';
      return NextResponse.redirect(url);
    }
  }

  // x-lang 헤더를 통해 루트 레이아웃에 언어 전달
  const lang = detectLang(pathname);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-lang', lang);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next|favicon|sitemap|robots).*)'],
};
