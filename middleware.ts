import { NextRequest, NextResponse } from 'next/server';
import { extractSlugFromPathname, RESERVED_SLUGS } from '@/lib/tenant';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 학원 slug 판별
  const slug = extractSlugFromPathname(pathname);
  const headers = new Headers(req.headers);

  if (slug) {
    // 학원 홈페이지 또는 관리자 요청
    headers.set('x-tenant-slug', slug);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    // API, _next 정적 파일, 파비콘 제외
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
