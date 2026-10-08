import { NextRequest, NextResponse } from 'next/server';

const RESERVED_SLUGS = new Set([
  'platform', 'admin', 'service', 'pricing', 'apply',
  'demo', 'consult', 'api', '_next', 'static', 'auth',
]);

function extractSlugFromPathname(pathname: string): string | null {
  const segment = pathname.split('/')[1] ?? '';
  if (!segment || RESERVED_SLUGS.has(segment.toLowerCase())) return null;
  return segment;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const slug = extractSlugFromPathname(pathname);
  const headers = new Headers(req.headers);

  if (slug) {
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
