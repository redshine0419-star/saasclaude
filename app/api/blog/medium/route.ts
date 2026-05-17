import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { publishToMedium } from '@/lib/medium';
import { auth } from '@/auth';
import type { BlogPost } from '../generate/route';

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, lang = 'ko' } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug 필요' }, { status: 400 });

  const { blobs } = await list({ prefix: `posts/${lang}/${slug}.json` });
  if (blobs.length === 0) return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });

  const res = await fetch(blobs[0].url, { cache: 'no-store' });
  if (!res.ok) return NextResponse.json({ error: '포스트 로드 실패' }, { status: 500 });
  const { post }: { post: BlogPost } = await res.json();

  try {
    const result = await publishToMedium({
      title: post.title,
      content: post.content,
      tags: post.tags,
      lang,
      slug,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
