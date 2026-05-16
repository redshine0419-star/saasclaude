import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') ?? '';

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|app|auth|_next|ja|en|blog|privacy|favicon).*)'],
};
