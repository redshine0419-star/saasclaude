import { NextRequest, NextResponse } from 'next/server';
import { del, list, put } from '@vercel/blob';
import type { PostIndex } from '../generate/route';

async function getIndex(lang: string): Promise<PostIndex[]> {
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

async function saveIndex(lang: string, index: PostIndex[]) {
  await put(`posts-index-${lang}.json`, JSON.stringify(index), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') || 'ko';
  const index = await getIndex(lang);
  return NextResponse.json({ posts: index });
}

export async function DELETE(req: NextRequest) {
  const { slug, lang = 'ko' } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug 필요' }, { status: 400 });

  try {
    const { blobs } = await list({ prefix: `posts/${lang}/${slug}.json` });
    if (blobs.length > 0) {
      await del(blobs[0].url);
    }

    const index = await getIndex(lang);
    const updated = index.filter((p) => p.slug !== slug);
    await saveIndex(lang, updated);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
