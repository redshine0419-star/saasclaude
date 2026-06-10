import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { generateText } from '@/lib/ai';
import { auth as getSession } from '@/auth';
import { getScheduleConfig, saveScheduleConfig, ScheduleConfig } from '../schedule/route';
import type { BlogPost, PostIndex } from '../generate/route';
import { postTweet, buildTweetText } from '@/lib/twitter';

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

function addCTA(content: string, lang: 'ko' | 'en' | 'ja'): string {
  const utm = '?utm_source=blog&utm_medium=cta&utm_campaign=blog_cta';
  const cta: Record<string, string> = {
    ko: `\n\n---\n\n> 🔍 **내 사이트 SEO·GEO 점수가 궁금하다면?**  \n> MarketerOps.ai에서 PageSpeed · SEO · GEO 점수를 무료로 즉시 진단해보세요.  \n> [→ MarketerOps.ai 무료 진단 시작](https://growweb.me${utm})\n`,
    en: `\n\n---\n\n> 🔍 **Want to check your site's SEO & GEO score?**  \n> Get a free instant diagnosis with MarketerOps.ai — PageSpeed · SEO · GEO scores.  \n> [→ Start Free Diagnosis at MarketerOps.ai](https://growweb.me${utm})\n`,
    ja: `\n\n---\n\n> 🔍 **サイトのSEO・GEOスコアを確認したいですか？**  \n> MarketerOps.aiで PageSpeed・SEO・GEO スコアを無料で即時診断できます。  \n> [→ MarketerOps.ai 無料診断を始める](https://growweb.me${utm})\n`,
  };
  return content + (cta[lang] ?? cta.ko);
}

async function notifySlack(msg: string) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: msg }),
  }).catch(() => {});
}

function buildPrompt(keyword: string, lang: 'ko' | 'en' | 'ja', targetAudience: string, tone: string): string {
  if (lang === 'ja') {
    return `キーワード: ${keyword}\nターゲット読者: ${targetAudience || 'マーケター、経営者'}\nトーン: ${tone || 'プロフェッショナルで実践的'}\n\n構成: 導入部 → 要点まとめブロッククォート → H2本文4〜5個(H3・表含む) → FAQ → まとめ\nSEO/GEO: キーワード自然配置、統計・事例、明確な定義、マークダウン表必須（比較・まとめ）、最低2500文字\n\n以下のJSON形式のみで回答してください（説明なしでJSONのみ）:\n{\n  "title": "SEO最適化されたタイトル（40〜60字、キーワード含む）",\n  "slug": "url-friendly-slug-in-english",\n  "metaDescription": "検索結果メタ説明（150〜160字、キーワード含む、クリック誘導）",\n  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],\n  "faq": [\n    {"q": "よくある質問1", "a": "簡潔で明確な回答（2〜3文）"},\n    {"q": "よくある質問2", "a": "簡潔で明確な回答"},\n    {"q": "よくある質問3", "a": "簡潔で明確な回答"}\n  ],\n  "content": "## 導入部見出し\\n\\n本文マークダウン..."\n}`;
  }
  if (lang === 'ko') {
    return `키워드: ${keyword}\n대상 독자: ${targetAudience || '마케터, 사업주'}\n톤앤매너: ${tone || '전문적이고 실용적인'}\n\n콘텐츠 구조: 도입부 → 핵심 요약 블록쿼트 → H2 본문 4-5개(H3, 표 포함) → FAQ → 마치며\nSEO/GEO: 키워드 자연 포함, 통계/사례, 명확한 정의, 마크다운 표 필수(비교/정리), 최소 2500자\n\n아래 JSON 형식으로만 응답하세요 (설명 없이 JSON만):\n{\n  "title": "SEO 최적화된 제목 (40-60자, 키워드 포함)",\n  "slug": "url-friendly-slug-in-english",\n  "metaDescription": "검색 결과 메타 설명 (150-160자, 키워드 포함, 클릭 유도)",\n  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],\n  "faq": [\n    {"q": "자주 묻는 질문1", "a": "간결하고 명확한 답변 (2-3문장)"},\n    {"q": "자주 묻는 질문2", "a": "간결하고 명확한 답변"},\n    {"q": "자주 묻는 질문3", "a": "간결하고 명확한 답변"}\n  ],\n  "content": "## 도입부 제목\\n\\n본문 마크다운..."\n}`;
  }
  return `Keyword: ${keyword}\nTarget audience: ${targetAudience || 'marketers, business owners'}\nTone: ${tone || 'professional and practical'}\n\nStructure: intro → Key Takeaways blockquote → 4-5 H2 sections (H3s, tables) → FAQ → Conclusion\nSEO/GEO: natural keyword use, stats/examples, clear definitions, markdown tables required, min 2500 chars\n\nRespond ONLY with this JSON (no explanation):\n{\n  "title": "SEO-optimized title (40-60 chars, include keyword)",\n  "slug": "url-friendly-slug-in-english",\n  "metaDescription": "Meta description (150-160 chars, keyword included, click-worthy)",\n  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],\n  "faq": [\n    {"q": "Frequently asked question 1", "a": "Clear, concise answer (2-3 sentences)"},\n    {"q": "Frequently asked question 2", "a": "Clear, concise answer"},\n    {"q": "Frequently asked question 3", "a": "Clear, concise answer"}\n  ],\n  "content": "## Introduction heading\\n\\nBody in markdown..."\n}`;
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
    content: addCTA(String(content), lang),
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

  await notifySlack(`📝 [MarketerOps] 새 블로그 발행\n제목: ${post.title} (${lang})\nURL: https://growweb.me/blog/${lang}/${post.slug}`);

  if (lang === 'ko') {
    const tweetText = buildTweetText(post.title, post.metaDescription || '', `https://growweb.me/blog/${lang}/${post.slug}`, '#SEO #마케팅 #디지털마케팅');
    await postTweet(tweetText);
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

export async function POST(req: NextRequest) {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
