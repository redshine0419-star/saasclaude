import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { auth } from '@/auth';
import { saveIndex } from '@/lib/blog-utils';
import type { BlogPost, PostIndex } from '@/lib/blog-utils';

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lang } = await req.json().catch(() => ({}));
  const langs = lang ? [lang] : ['ko', 'en', 'ja'];

  const results: Record<string, { rebuilt: number; errors: string[] }> = {};

  for (const l of langs) {
    const errors: string[] = [];
    const indexEntries: PostIndex[] = [];

    try {
      // 개별 포스트 파일 전체 목록 가져오기
      let cursor: string | undefined;
      do {
        const { blobs, cursor: next } = await list({
          prefix: `posts/${l}/`,
          cursor,
          limit: 100,
        });

        for (const blob of blobs) {
          if (!blob.pathname.endsWith('.json')) continue;
          try {
            const res = await fetch(blob.url, { cache: 'no-store' });
            if (!res.ok) { errors.push(`fetch 실패: ${blob.pathname}`); continue; }
            const post: BlogPost = await res.json();
            if (!post.slug || !post.title) { errors.push(`필드 누락: ${blob.pathname}`); continue; }
            indexEntries.push({
              slug: post.slug,
              title: post.title,
              metaDescription: post.metaDescription ?? '',
              tags: post.tags ?? [],
              createdAt: post.createdAt ?? new Date().toISOString(),
              keyword: post.keyword ?? '',
            });
          } catch (e) {
            errors.push(`파싱 오류 ${blob.pathname}: ${(e as Error).message}`);
          }
        }

        cursor = next;
      } while (cursor);

      // 최신순 정렬 후 저장
      indexEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      await saveIndex(l, indexEntries);

      results[l] = { rebuilt: indexEntries.length, errors };
    } catch (e) {
      results[l] = { rebuilt: 0, errors: [`전체 오류: ${(e as Error).message}`] };
    }
  }

  return NextResponse.json({ ok: true, results });
}
