import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { generateText } from '@/lib/ai';
import { getScheduleConfig, saveScheduleConfig } from '../schedule/route';
import type { BlogPost, PostIndex } from '../generate/route';

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

JSON만 응답:
{"title":"제목(40-60자)","slug":"english-slug","metaDescription":"메타설명(150-160자)","tags":["t1","t2","t3","t4","t5"],"faq":[{"q":"질문","a":"답변"}],"content":"## 제목\\n\\n내용..."}`
    : `Senior content marketer + SEO/GEO expert.
Keyword: ${keyword}
Audience: ${targetAudience || 'marketers, business owners'}
Tone: ${tone || 'professional and practical'}

Structure: intro → Key Takeaways blockquote → 4-5 H2 sections (H3s, tables) → FAQ → Conclusion
SEO/GEO: natural keyword use, stats/examples, clear definitions, markdown tables required, min 2500 chars

JSON only:
{"title":"title(40-60chars)","slug":"english-slug","metaDescription":"meta(150-160chars)","tags":["t1","t2","t3","t4","t5"],"faq":[{"q":"Q","a":"A"}],"content":"## Heading\\n\\nContent..."}`;

  try {
    const { text } = await generateText(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI 응답 파싱 실패');

    const parsed = JSON.parse(match[0]);
    const { title, slug, metaDescription, tags, faq, content } = parsed;
    if (!title || !slug || !content) throw new Error('필수 필드 누락');

    const post: BlogPost = {
      slug, lang, title,
      metaDescription: metaDescription || '',
      tags: Array.isArray(tags) ? tags : [],
      faq: Array.isArray(faq) ? faq : [],
      content,
      createdAt: new Date().toISOString(),
      keyword,
    };

    await put(`posts/${lang}/${slug}.json`, JSON.stringify(post), {
      access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
    });

    const index = await getIndex(lang);
    const existingIdx = index.findIndex((p) => p.slug === slug);
    const entry: PostIndex = { slug, title, metaDescription: post.metaDescription, tags: post.tags, createdAt: post.createdAt, keyword };
    if (existingIdx >= 0) index[existingIdx] = entry;
    else index.unshift(entry);
    await saveIndex(lang, index);

    await saveScheduleConfig({
      ...config,
      lastRunAt: new Date().toISOString(),
      nextRunAt: new Date(now + config.intervalHours * 3600 * 1000).toISOString(),
      currentKeywordIndex: (currentKeywordIndex + 1) % keywords.length,
    });

    return NextResponse.json({ generated: slug });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
