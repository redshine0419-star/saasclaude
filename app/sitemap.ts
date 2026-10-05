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

  const tenantUrls = tenants.map((t) => ({
    url: `${baseUrl}/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

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
