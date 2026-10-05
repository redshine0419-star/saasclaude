import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';

  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { slug: true, updatedAt: true },
  }).catch(() => []);

  const tenantUrls = tenants.map((t) => ({
    url: `${baseUrl}/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    ...tenantUrls,
  ];
}
