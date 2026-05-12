import { NextRequest, NextResponse } from 'next/server';
import { del, list, put } from '@vercel/blob';
import type { PostIndex, BlogPost } from '../generate/route';

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
    allowOverwrite: true,
  });
}

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') || 'ko';
  const index = await getIndex(lang);
  return NextResponse.json({ posts: index });
}

export async function PUT(req: NextRequest) {
  const { slug, lang = 'ko', title, metaDescription, tags, content, faq } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug 필요' }, { status: 400 });

  try {
    const { blobs } = await list({ prefix: `posts/${lang}/${slug}.json` });
    if (blobs.length === 0) return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });

    const existing: BlogPost = await fetch(blobs[0].url, { cache: 'no-store' }).then((r) => r.json());

    const updated: BlogPost = {
      ...existing,
      title: title ?? existing.title,
      metaDescription: metaDescription ?? existing.metaDescription,
      tags: Array.isArray(tags) ? tags : existing.tags,
      content: content ?? existing.content,
      faq: Array.isArray(faq) ? faq : existing.faq,
    };

    await put(`posts/${lang}/${slug}.json`, JSON.stringify(updated), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    const index = await getIndex(lang);
    const idx = index.findIndex((p) => p.slug === slug);
    const entry: PostIndex = { slug, title: updated.title, metaDescription: updated.metaDescription, tags: updated.tags, createdAt: updated.createdAt, keyword: updated.keyword };
    if (idx >= 0) index[idx] = entry;
    await saveIndex(lang, index);

    return NextResponse.json({ post: updated });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { slug, lang = 'ko' } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug 필요' }, { status: 400 });

  try {
    const { blobs } = await list({ prefix: `posts/${lang}/${slug}.json` });
    if (blobs.length > 0) await del(blobs[0].url);

    const index = await getIndex(lang);
    await saveIndex(lang, index.filter((p) => p.slug !== slug));

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
