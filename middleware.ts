import { NextRequest, NextResponse } from 'next/server';
import { isReservedSlug } from '@/lib/reserved-slugs';
import { isPlatformHost, resolveSlugByHost } from '@/lib/domains/resolve';

const PLATFORM_ORIGIN = 'https://growweb.me';

function extractSlugFromPathname(pathname: string): string | null {
  const segment = pathname.split('/')[1] ?? '';
  if (!segment || isReservedSlug(segment)) return null;
  return segment;
}

function withTenant(req: NextRequest, slug: string) {
  const headers = new Headers(req.headers);
  headers.set('x-tenant-slug', slug);
  return headers;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = (req.headers.get('host') ?? '').toLowerCase().replace(/:\d+$/, '');

  // 학원 커스텀 도메인
  if (host && !isPlatformHost(host) && pathname !== '/robots.txt' && pathname !== '/sitemap.xml') {
    const slug = await resolveSlugByHost(host);
    if (slug) {
      const first = pathname.split('/')[1] ?? '';
      // 로그인 쿠키는 growweb.me에 있으므로 관리자·로그인은 플랫폼 도메인으로 보낸다 (학부모 리포트 /r 도 플랫폼 주소)
      if (['auth', 'platform', 'start', 'r'].includes(first) || pathname.startsWith(`/${slug}/admin`)) {
        return NextResponse.redirect(new URL(`${pathname}${search}`, PLATFORM_ORIGIN));
      }
      if (first === slug) {
        return NextResponse.next({ request: { headers: withTenant(req, slug) } });
      }
      const target = req.nextUrl.clone();
      target.pathname = pathname === '/' ? `/${slug}` : `/${slug}${pathname}`;
      return NextResponse.rewrite(target, { request: { headers: withTenant(req, slug) } });
    }
  }

  const slug = extractSlugFromPathname(pathname);
  if (slug) {
    return NextResponse.next({ request: { headers: withTenant(req, slug) } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // API, _next 정적 파일, 파비콘 제외
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
