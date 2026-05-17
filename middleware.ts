import { NextRequest, NextResponse } from 'next/server';

function detectLang(pathname: string): string {
  if (pathname.startsWith('/blog/ko') || pathname.startsWith('/ko')) return 'ko';
  if (pathname.startsWith('/blog/en') || pathname.startsWith('/en')) return 'en';
  if (pathname.startsWith('/blog/ja') || pathname.startsWith('/ja')) return 'ja';
  return 'ko';
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const country = req.headers.get('x-vercel-ip-country') ?? '';

  // 국가 기반 리다이렉트
  if (country === 'JP') {
    const url = req.nextUrl.clone();
    url.pathname = '/ja';
    return NextResponse.redirect(url);
  }
  if (country !== '' && country !== 'KR') {
    const url = req.nextUrl.clone();
    url.pathname = '/en';
    return NextResponse.redirect(url);
  }

  // x-lang 헤더를 통해 루트 레이아웃에 언어 전달
  const lang = detectLang(pathname);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-lang', lang);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next|favicon).*)'],
};
