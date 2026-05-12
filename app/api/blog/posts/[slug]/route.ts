import { NextRequest, NextResponse } from 'next/server';
import type { BlogPost } from '../../generate/route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const lang = req.nextUrl.searchParams.get('lang') || 'ko';

  const blobUrl = process.env.BLOB_BASE_URL;
  if (!blobUrl) {
    return NextResponse.json({ error: 'BLOB_BASE_URL not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`${blobUrl}/posts/${lang}/${slug}.json`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
    }
    const post: BlogPost = await res.json();
    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
