import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';

  const [tenants, posts] = await Promise.all([
    prisma.tenant.findMany({
      where: { status: 'active' },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
    prisma.post.findMany({
      where: { status: 'published', tenant: { status: 'active' } },
      include: { tenant: { select: { slug: true } } },
    }).catch(() => []),
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
    ...tenantUrls,
    ...postUrls,
  ];
}
