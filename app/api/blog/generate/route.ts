import { NextRequest, NextResponse } from 'next/server';
import { put, head, del } from '@vercel/blob';
import { generateText } from '@/lib/ai';

export interface BlogPost {
  slug: string;
  lang: 'ko' | 'en';
  title: string;
  metaDescription: string;
  tags: string[];
  content: string;
  createdAt: string;
  keyword: string;
}

export interface PostIndex {
  slug: string;
  title: string;
  metaDescription: string;
  tags: string[];
  createdAt: string;
  keyword: string;
}

async function getIndex(lang: string): Promise<PostIndex[]> {
  try {
    const url = process.env.BLOB_BASE_URL
      ? `${process.env.BLOB_BASE_URL}/posts-index-${lang}.json`
      : null;
    if (!url) return [];
    const res = await fetch(url, { cache: 'no-store' });
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

export async function POST(req: NextRequest) {
  const { keyword, targetAudience, tone, lang = 'ko' } = await req.json();

  if (!keyword?.trim()) {
    return NextResponse.json({ error: '키워드를 입력해주세요.' }, { status: 400 });
  }
  if (lang !== 'ko' && lang !== 'en') {
    return NextResponse.json({ error: '언어는 ko 또는 en이어야 합니다.' }, { status: 400 });
  }

  const isKo = lang === 'ko';

  const prompt = isKo
    ? `당신은 SEO 전문가이자 블로그 작가입니다.
다음 정보를 바탕으로 검색 유입에 최적화된 한국어 블로그 포스트를 작성하세요.

키워드: ${keyword}
대상 독자: ${targetAudience || '마케터, 사업주'}
톤앤매너: ${tone || '전문적이고 실용적인'}

아래 JSON 형식으로만 응답하세요 (설명 없이 JSON만):
{
  "title": "SEO 최적화된 제목 (50-60자)",
  "slug": "url-friendly-slug-in-english",
  "metaDescription": "검색 결과에 표시될 메타 설명 (150-160자)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "content": "## 도입부\\n\\n본문 마크다운 (최소 2000자, H2/H3 헤딩, 실용적인 내용)"
}`
    : `You are an SEO expert and blog writer.
Write a search-optimized English blog post based on the following:

Keyword: ${keyword}
Target audience: ${targetAudience || 'marketers, business owners'}
Tone: ${tone || 'professional and practical'}

Respond ONLY with this JSON format (no explanation):
{
  "title": "SEO-optimized title (50-60 chars)",
  "slug": "url-friendly-slug-in-english",
  "metaDescription": "Meta description for search results (150-160 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "content": "## Introduction\\n\\nBody in markdown (min 2000 chars, H2/H3 headings, practical content)"
}`;

  try {
    const { text } = await generateText(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 응답 파싱 실패');

    const parsed = JSON.parse(match[0]);
    const { title, slug, metaDescription, tags, content } = parsed;

    if (!title || !slug || !content) throw new Error('필수 필드 누락');

    const post: BlogPost = {
      slug,
      lang,
      title,
      metaDescription: metaDescription || '',
      tags: Array.isArray(tags) ? tags : [],
      content,
      createdAt: new Date().toISOString(),
      keyword,
    };

    await put(`posts/${lang}/${slug}.json`, JSON.stringify(post), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    const index = await getIndex(lang);
    const existingIdx = index.findIndex((p) => p.slug === slug);
    const indexEntry: PostIndex = { slug, title, metaDescription: post.metaDescription, tags: post.tags, createdAt: post.createdAt, keyword };
    if (existingIdx >= 0) index[existingIdx] = indexEntry;
    else index.unshift(indexEntry);
    await saveIndex(lang, index);

    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
