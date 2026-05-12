import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import type { BlogPost } from '../../generate/route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const lang = req.nextUrl.searchParams.get('lang') || 'ko';

  try {
    const { blobs } = await list({ prefix: `posts/${lang}/${slug}.json` });
    if (blobs.length === 0) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }
    const post: BlogPost = await res.json();
    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
