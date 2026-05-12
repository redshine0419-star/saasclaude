import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { generateText } from '@/lib/ai';

export interface BlogPost {
  slug: string;
  lang: 'ko' | 'en';
  title: string;
  metaDescription: string;
  tags: string[];
  faq: { q: string; a: string }[];
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

export async function POST(req: NextRequest) {
  const { keyword, targetAudience, tone, lang = 'ko', createdAt } = await req.json();

  if (!keyword?.trim()) {
    return NextResponse.json({ error: '키워드를 입력해주세요.' }, { status: 400 });
  }
  if (lang !== 'ko' && lang !== 'en') {
    return NextResponse.json({ error: '언어는 ko 또는 en이어야 합니다.' }, { status: 400 });
  }

  const isKo = lang === 'ko';

  const prompt = isKo
    ? `당신은 시니어 콘텐츠 마케터이자 SEO/GEO 전문가입니다.
다음 정보를 바탕으로 검색 유입과 AI 인용에 최적화된 한국어 블로그 포스트를 작성하세요.

키워드: ${keyword}
대상 독자: ${targetAudience || '마케터, 사업주'}
톤앤매너: ${tone || '전문적이고 실용적인'}

콘텐츠 구조 (반드시 이 순서로):
1. 도입부 - 독자의 공감을 얻는 문제 제기 (2-3문장), 이 글에서 얻을 것 1줄 요약
2. 핵심 요약 블록쿼트: > **핵심 요약**\\n> - 포인트1\\n> - 포인트2\\n> - 포인트3 (GEO 최적화)
3. H2 본문 섹션 4-5개 (각 섹션에 H3 소제목 1-2개, 단락 2-3개, 필요시 불릿 리스트)
4. ## 자주 묻는 질문 섹션 (H3으로 질문, 본문에 답변 포함)
5. ## 마치며 (행동 촉구 포함)

SEO/GEO 요건:
- 키워드를 제목, 첫 단락, H2 1개에 자연스럽게 포함
- 각 단락은 3-5문장, 한 가지 아이디어만
- 숫자/통계/구체적 사례 포함
- AI가 답변 시 인용할 수 있는 명확한 정의와 리스트 포함
- 최소 2500자
- 비교/정리/순위 내용이 있으면 반드시 마크다운 표(| 컬럼 | 컬럼 |) 사용

아래 JSON 형식으로만 응답하세요 (설명 없이 JSON만):
{
  "title": "SEO 최적화된 제목 (40-60자, 키워드 포함)",
  "slug": "url-friendly-slug-in-english",
  "metaDescription": "검색 결과 메타 설명 (150-160자, 키워드 포함, 클릭 유도)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "faq": [
    {"q": "자주 묻는 질문1", "a": "간결하고 명확한 답변 (2-3문장)"},
    {"q": "자주 묻는 질문2", "a": "간결하고 명확한 답변"},
    {"q": "자주 묻는 질문3", "a": "간결하고 명확한 답변"}
  ],
  "content": "## 도입부 제목\\n\\n본문 마크다운..."
}`
    : `You are a senior content marketer and SEO/GEO specialist.
Write a search- and AI-optimized English blog post based on the following:

Keyword: ${keyword}
Target audience: ${targetAudience || 'marketers, business owners'}
Tone: ${tone || 'professional and practical'}

Content structure (in this exact order):
1. Introduction — 2-3 sentences addressing the reader's pain point, 1-line summary of what they'll learn
2. Key Takeaways blockquote: > **Key Takeaways**\\n> - Point 1\\n> - Point 2\\n> - Point 3 (for GEO)
3. 4-5 H2 body sections (each with 1-2 H3 subheadings, 2-3 paragraphs, bullet lists where helpful)
4. ## Frequently Asked Questions section (H3 for each question, answer in body)
5. ## Conclusion (with call to action)

SEO/GEO requirements:
- Include keyword in title, first paragraph, and one H2 naturally
- Each paragraph: 3-5 sentences, one idea only
- Include numbers, stats, or concrete examples
- Include clear definitions and lists that AI assistants can cite
- Minimum 2500 characters
- Use markdown tables (| col | col |) for any comparisons, rankings, or summaries

Respond ONLY with this JSON (no explanation):
{
  "title": "SEO-optimized title (40-60 chars, include keyword)",
  "slug": "url-friendly-slug-in-english",
  "metaDescription": "Meta description (150-160 chars, keyword included, click-worthy)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "faq": [
    {"q": "Frequently asked question 1", "a": "Clear, concise answer (2-3 sentences)"},
    {"q": "Frequently asked question 2", "a": "Clear, concise answer"},
    {"q": "Frequently asked question 3", "a": "Clear, concise answer"}
  ],
  "content": "## Introduction heading\\n\\nBody in markdown..."
}`;

  try {
    const { text } = await generateText(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 응답 파싱 실패');

    const parsed = JSON.parse(match[0]);
    const { title, slug, metaDescription, tags, faq, content } = parsed;

    if (!title || !slug || !content) throw new Error('필수 필드 누락');

    const post: BlogPost = {
      slug,
      lang,
      title,
      metaDescription: metaDescription || '',
      tags: Array.isArray(tags) ? tags : [],
      faq: Array.isArray(faq) ? faq : [],
      content,
      createdAt: createdAt || new Date().toISOString(),
      keyword,
    };

    await put(`posts/${lang}/${slug}.json`, JSON.stringify(post), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
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
