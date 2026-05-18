import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';
import { auth } from '@/auth';
import type { BlogPost } from '../../blog/generate/route';

// Phrases to strip from blog content (regex patterns)
const PERSONA_PATTERNS = [
  // Korean
  /당신은 시니어 콘텐츠 마케터이자 SEO\/GEO 전문가입니다[.\n]*/g,
  /저는 시니어 콘텐츠 마케터(이자|로서)[^.\n]*[.\n]*/g,
  /시니어 콘텐츠 마케터(이자|로서|인 저는)[^.\n]*[.\n]*/g,
  // English
  /As a senior content marketer and SEO\/GEO specialist[^.\n]*[.\n]*/gi,
  /I('m| am) a senior content marketer[^.\n]*[.\n]*/gi,
  /As an? (SEO\/GEO specialist|senior marketer)[^.\n]*[.\n]*/gi,
  // Japanese
  /私はシニアコンテンツマーケター(かつ|として)[^。\n]*[。\n]*/g,
  /シニアコンテンツマーケターとして[^。\n]*[。\n]*/g,
];

function cleanContent(content: string): { cleaned: string; changed: boolean } {
  let cleaned = content;
  for (const pattern of PERSONA_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Collapse triple+ newlines caused by removal
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return { cleaned, changed: cleaned !== content };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get('dry') === 'true';
  const langs = ['ko', 'en', 'ja'] as const;
  const report: { lang: string; slug: string; changed: boolean }[] = [];

  for (const lang of langs) {
    // Get index to find all slugs
    const { blobs: indexBlobs } = await list({ prefix: `posts-index-${lang}.json` });
    if (indexBlobs.length === 0) continue;

    const indexRes = await fetch(indexBlobs[0].url, { cache: 'no-store' });
    if (!indexRes.ok) continue;
    const index: { slug: string }[] = await indexRes.json();

    for (const { slug } of index) {
      const { blobs } = await list({ prefix: `posts/${lang}/${slug}.json` });
      if (blobs.length === 0) continue;

      const res = await fetch(blobs[0].url, { cache: 'no-store' });
      if (!res.ok) continue;
      const post: BlogPost = await res.json();

      const { cleaned, changed } = cleanContent(post.content);
      report.push({ lang, slug, changed });

      if (changed && !dryRun) {
        const updated: BlogPost = { ...post, content: cleaned };
        await put(`posts/${lang}/${slug}.json`, JSON.stringify(updated), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      }
    }
  }

  const changed = report.filter((r) => r.changed);
  return NextResponse.json({
    dryRun,
    total: report.length,
    changed: changed.length,
    posts: changed,
  });
}
