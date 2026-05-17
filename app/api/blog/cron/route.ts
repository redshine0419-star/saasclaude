import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { generateText } from '@/lib/ai';
import { getScheduleConfig, saveScheduleConfig, ScheduleConfig } from '../schedule/route';
import type { BlogPost, PostIndex } from '../generate/route';

function sanitizeSlug(raw: string): string {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) || 'post';
}

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

function buildPrompt(keyword: string, lang: 'ko' | 'en' | 'ja', targetAudience: string, tone: string): string {
  if (lang === 'ja') {
    return `あなたはシニアコンテンツマーケターかつSEO/GEO専門家です。
キーワード: ${keyword}
ターゲット読者: ${targetAudience || 'マーケター、経営者'}
トーン: ${tone || 'プロフェッショナルで実践的'}

構成: 導入部 → 要点まとめブロッククォート → H2本文4〜5個(H3・表含む) → FAQ → まとめ
SEO/GEO: キーワード自然配置、統計・事例、明確な定義、マークダウン表必須（比較・まとめ）、最低2500文字

以下のJSON形式のみで回答してください（説明なしでJSONのみ）:
{
  "title": "SEO最適化されたタイトル（40〜60字、キーワード含む）",
  "slug": "url-friendly-slug-in-english",
  "metaDescription": "検索結果メタ説明（150〜160字、キーワード含む、クリック誘導）",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "faq": [
    {"q": "よくある質問1", "a": "簡潔で明確な回答（2〜3文）"},
    {"q": "よくある質問2", "a": "簡潔で明確な回答"},
    {"q": "よくある質問3", "a": "簡潔で明確な回答"}
  ],
  "content": "## 導入部見出し\\n\\n本文マークダウン..."
}`;
  }
  if (lang === 'ko') {
    return `당신은 시니어 콘텐츠 마케터이자 SEO/GEO 전문가입니다.
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
}`;
  }
  return `You are a senior content marketer and SEO/GEO specialist.
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
}

async function runOneLang(config: ScheduleConfig, now: number, testMode = false): Promise<{ slug?: string; skipped?: string; error?: string }> {
  const { lang, keywords, targetAudience, tone, currentKeywordIndex } = config;

  if (!config.enabled && !testMode) return { skipped: 'disabled' };
  if (keywords.length === 0) return { skipped: 'no keywords' };
  if (!testMode && config.nextRunAt && new Date(config.nextRunAt).getTime() > now) {
    return { skipped: 'not yet' };
  }

  const keyword = keywords[currentKeywordIndex % keywords.length];
  const prompt = buildPrompt(keyword, lang, targetAudience, tone);

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

  if (!parsed) return { error: lastErr || 'AI 응답 파싱 실패 (3회 시도)' };

  const { title, slug, metaDescription, tags, faq, content } = parsed as Record<string, unknown>;
  if (!title || !slug || !content) return { error: '필수 필드 누락' };

  const post: BlogPost = {
    slug: sanitizeSlug(String(slug)), lang, title: String(title),
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

  if (!testMode) {
    await saveScheduleConfig(lang, {
      ...config,
      lastRunAt: new Date().toISOString(),
      nextRunAt: new Date(now + config.intervalHours * 3600 * 1000).toISOString(),
      currentKeywordIndex: (currentKeywordIndex + 1) % keywords.length,
    });
  }

  return { slug: post.slug };
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const langs = ['ko', 'en', 'ja'] as const;
  const results: Record<string, unknown> = {};

  for (const lang of langs) {
    const config = await getScheduleConfig(lang);
    results[lang] = await runOneLang(config, now);
  }

  return NextResponse.json({ results });
}

// POST: test publish for a single lang (no CRON_SECRET needed — protected by app session in the frontend)
export async function POST(req: NextRequest) {
  const lang = (req.nextUrl.searchParams.get('lang') ?? 'ko') as 'ko' | 'en' | 'ja';
  try {
    const config = await getScheduleConfig(lang);
    if (config.keywords.length === 0) {
      return NextResponse.json({ error: '키워드를 먼저 등록하고 저장해주세요.' }, { status: 400 });
    }
    const result = await runOneLang(config, Date.now(), true);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
