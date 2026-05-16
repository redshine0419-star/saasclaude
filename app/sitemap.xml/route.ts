import { list } from '@vercel/blob';
import type { PostIndex } from '@/app/api/blog/generate/route';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';

async function getPosts(lang: 'ko' | 'en' | 'ja'): Promise<PostIndex[]> {
  try {
    const { blobs } = await list({ prefix: `posts-index-${lang}.json` });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  const [koPosts, enPosts, jaPosts] = await Promise.all([
    getPosts('ko'),
    getPosts('en'),
    getPosts('ja'),
  ]);

  const staticEntries = [
    urlEntry(BASE_URL, today, 'weekly', '1.0'),
    urlEntry(`${BASE_URL}/en`, today, 'weekly', '0.9'),
    urlEntry(`${BASE_URL}/ja`, today, 'weekly', '0.9'),
    urlEntry(`${BASE_URL}/blog/ko`, today, 'daily', '0.8'),
    urlEntry(`${BASE_URL}/blog/en`, today, 'daily', '0.8'),
    urlEntry(`${BASE_URL}/blog/ja`, today, 'daily', '0.8'),
    urlEntry(`${BASE_URL}/privacy`, today, 'yearly', '0.3'),
  ];

  const blogEntries = [
    ...koPosts.map((p) => urlEntry(`${BASE_URL}/blog/ko/${p.slug}`, p.createdAt.split('T')[0], 'monthly', '0.7')),
    ...enPosts.map((p) => urlEntry(`${BASE_URL}/blog/en/${p.slug}`, p.createdAt.split('T')[0], 'monthly', '0.7')),
    ...jaPosts.map((p) => urlEntry(`${BASE_URL}/blog/ja/${p.slug}`, p.createdAt.split('T')[0], 'monthly', '0.7')),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...blogEntries].join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
