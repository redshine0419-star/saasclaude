import { put, list } from '@vercel/blob';

export interface BlogPost {
  slug: string;
  lang: 'ko' | 'en' | 'ja';
  title: string;
  metaDescription: string;
  tags: string[];
  faq: { q: string; a: string }[];
  content: string;
  createdAt: string;
  keyword: string;
  heroImage?: string;
}

export interface PostIndex {
  slug: string;
  title: string;
  metaDescription: string;
  tags: string[];
  createdAt: string;
  keyword: string;
}

export function sanitizeSlug(raw: string): string {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) || 'post';
}

export function extractJson(text: string): Record<string, unknown> | null {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (start === -1) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

export async function getIndex(lang: string): Promise<PostIndex[]> {
  try {
    const { blobs } = await list({ prefix: `posts-index-${lang}.json` });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchUnsplashImage(keyword: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(keyword.slice(0, 80));
    const res = await fetch(`https://source.unsplash.com/1200x630/?${encoded}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok || !res.url) return null;
    return res.url;
  } catch {
    return null;
  }
}

export async function saveIndex(lang: string, index: PostIndex[]): Promise<void> {
  await put(`posts-index-${lang}.json`, JSON.stringify(index), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
