import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/platform/', '/api/', '/*/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
