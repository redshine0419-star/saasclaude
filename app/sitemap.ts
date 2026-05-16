import { MetadataRoute } from 'next';
import { list } from '@vercel/blob';
import type { PostIndex } from '@/app/api/blog/generate/route';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';

async function getBlogPosts(lang: 'ko' | 'en' | 'ja'): Promise<PostIndex[]> {
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [koPosts, enPosts, jaPosts] = await Promise.all([
    getBlogPosts('ko'),
    getBlogPosts('en'),
    getBlogPosts('ja'),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/en`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/ja`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/blog/ko`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/blog/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/blog/ja`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = [
    ...koPosts.map((post) => ({
      url: `${BASE_URL}/blog/ko/${post.slug}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...enPosts.map((post) => ({
      url: `${BASE_URL}/blog/en/${post.slug}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...jaPosts.map((post) => ({
      url: `${BASE_URL}/blog/ja/${post.slug}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...blogRoutes];
}
