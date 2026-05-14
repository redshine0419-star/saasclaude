import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { generateText } from '@/lib/ai';
import { getScheduleConfig, saveScheduleConfig } from '../schedule/route';
import type { BlogPost, PostIndex } from '../generate/route';

function extractJson(text: string): Record<string, unknown> | null {
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
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await getScheduleConfig();

  if (!config.enabled) return NextResponse.json({ skipped: 'disabled' });
  if (config.keywords.length === 0) return NextResponse.json({ skipped: 'no keywords' });

  const now = Date.now();
  if (config.nextRunAt && new Date(config.nextRunAt).getTime() > now) {
    return NextResponse.json({ skipped: 'not yet', nextRunAt: config.nextRunAt });
  }

  const { lang, keywords, targetAudience, tone, currentKeywordIndex } = config;
  const keyword = keywords[currentKeywordIndex % keywords.length];
  const isKo = lang === 'ko';

  const prompt = isKo
    ? `당신은 시니어 콘텐츠 마케터이자 SEO/GEO 전문가입니다.
키워드: ${keyword}
대상 독자: ${targetAudience || '마케터, 사업주'}
톤앤매너: ${tone || '전문적이고 실용적인'}

콘텐츠 구조: 도입부 → 핵심 요약 블록쿼트 → H2 본문 4-5개(H3, 표 포함) → FAQ → 마치며
SEO/GEO: 키워드 자연 포함, 통계/사례, 명확한 정의, 마크다운 표 필수(비교/정리), 최소 2500자

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
Keyword: ${keyword}
Target audience: ${targetAudience || 'marketers, business owners'}
Tone: ${tone || 'professional and practical'}

Structure: intro → Key Takeaways blockquote → 4-5 H2 sections (H3s, tables) → FAQ → Conclusion
SEO/GEO: natural keyword use, stats/examples, clear definitions, markdown tables required, min 2500 chars

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

  // 3회 재시도
  let parsed: Record<string, unknown> | null = null;
  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { text } = await generateText(prompt);
      parsed = extractJson(text);
      if (parsed && parsed.title && parsed.slug && parsed.content) break;
      lastErr = parsed ? '필수 필드 누락' : 'AI 응답 파싱 실패';
      parsed = null;
    } catch (e) {
      lastErr = (e as Error).message;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 2000));
  }

  try {
    if (!parsed) throw new Error(lastErr || 'AI 응답 파싱 실패 (3회 시도)');
    const { title, slug, metaDescription, tags, faq, content } = parsed as Record<string, unknown>;
    if (!title || !slug || !content) throw new Error('필수 필드 누락');

    const post: BlogPost = {
      slug: String(slug), lang, title: String(title),
      metaDescription: metaDescription ? String(metaDescription) : '',
      tags: Array.isArray(tags) ? (tags as string[]) : [],
      faq: Array.isArray(faq) ? (faq as { q: string; a: string }[]) : [],
      content: String(content),
      createdAt: new Date().toISOString(),
      keyword,
    };

    await put(`posts/${lang}/${post.slug}.json`, JSON.stringify(post), {
      access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
    });

    const index = await getIndex(lang);
    const existingIdx = index.findIndex((p) => p.slug === post.slug);
    const entry: PostIndex = { slug: post.slug, title: post.title, metaDescription: post.metaDescription, tags: post.tags, createdAt: post.createdAt, keyword };
    if (existingIdx >= 0) index[existingIdx] = entry;
    else index.unshift(entry);
    await saveIndex(lang, index);

    await saveScheduleConfig({
      ...config,
      lastRunAt: new Date().toISOString(),
      nextRunAt: new Date(now + config.intervalHours * 3600 * 1000).toISOString(),
      currentKeywordIndex: (currentKeywordIndex + 1) % keywords.length,
    });

    return NextResponse.json({ generated: post.slug });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
