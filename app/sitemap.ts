import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { publishedWhere } from '@/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';

  const [tenants, posts, blogPosts] = await Promise.all([
    prisma.tenant.findMany({
      where: { status: 'active' },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
    prisma.post.findMany({
      where: { status: 'published', tenant: { status: 'active' } },
      include: { tenant: { select: { slug: true } } },
    }).catch(() => []),
    prisma.blogPost.findMany({ where: publishedWhere(), select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);

  const TENANT_SUBPAGES = ['about', 'classes', 'fee', 'reviews', 'news', 'location', 'consult'];

  const tenantUrls = tenants.flatMap((t) => [
    {
      url: `${baseUrl}/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    ...TENANT_SUBPAGES.map((page) => ({
      url: `${baseUrl}/${t.slug}/${page}`,
      lastModified: t.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]);

  const postUrls = posts.map((p) => ({
    url: `${baseUrl}/${p.tenant.slug}/news/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    // 서비스 사이트 공개 페이지 (바로 만들기 /start 는 로그인 뒤라 넣지 않는다)
    ...[
      { path: '/service', priority: 0.9 },
      { path: '/pricing', priority: 0.9 },
      { path: '/demo', priority: 0.8 },
      { path: '/consult', priority: 0.8 },
      { path: '/privacy', priority: 0.2 },
      { path: '/terms', priority: 0.2 },
    ].map((x) => ({ url: `${baseUrl}${x.path}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: x.priority })),
    { url: `${baseUrl}/blog`, lastModified: blogPosts.length ? blogPosts.reduce((m, b) => (b.updatedAt > m ? b.updatedAt : m), blogPosts[0].updatedAt) : new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    ...blogPosts.map((b) => ({ url: `${baseUrl}/blog/${b.slug}`, lastModified: b.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...tenantUrls,
    ...postUrls,
  ];
}
