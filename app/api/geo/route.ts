import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface GeoResult {
  llmsTxt: { exists: boolean; url: string };
  robotsTxt: { exists: boolean; llmBlocked: boolean; content: string };
  jsonLd: { exists: boolean; types: string[]; count: number; raw: string[] };
  metaTags: {
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    canonical: string | null;
  };
  headings: { h1: string[]; h2: string[] };
  images: { total: number; missingAlt: number };
  score: number;
  issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
}

async function safeFetch(url: string, timeout = 8000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MarketerOps-Bot/1.0 (GEO Analyzer)' },
    });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
  }

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return NextResponse.json({ error: '유효하지 않은 URL입니다.' }, { status: 400 });
  }

  const [pageRes, llmsRes, robotsRes] = await Promise.all([
    safeFetch(url),
    safeFetch(`${origin}/llms.txt`),
    safeFetch(`${origin}/robots.txt`),
  ]);

  const result: GeoResult = {
    llmsTxt: { exists: false, url: `${origin}/llms.txt` },
    robotsTxt: { exists: false, llmBlocked: false, content: '' },
    jsonLd: { exists: false, types: [], count: 0, raw: [] },
    metaTags: { title: null, description: null, ogTitle: null, ogDescription: null, ogImage: null, canonical: null },
    headings: { h1: [], h2: [] },
    images: { total: 0, missingAlt: 0 },
    score: 0,
    issues: [],
  };

  // llms.txt
  if (llmsRes && llmsRes.ok) {
    result.llmsTxt.exists = true;
  }

  // robots.txt
  if (robotsRes && robotsRes.ok) {
    const robotsText = await robotsRes.text();
    result.robotsTxt.exists = true;
    result.robotsTxt.content = robotsText.slice(0, 500);
    const lower = robotsText.toLowerCase();
    result.robotsTxt.llmBlocked =
      lower.includes('gptbot') ||
      lower.includes('claudebot') ||
      lower.includes('anthropic') ||
      lower.includes('chatgpt');
  }

  // HTML 파싱
  if (pageRes && pageRes.ok) {
    const html = await pageRes.text();
    const $ = cheerio.load(html);

    // JSON-LD
    const jsonLdScripts: string[] = [];
    const jsonLdTypes: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).html() ?? '';
      jsonLdScripts.push(raw.trim().slice(0, 300));
      try {
        const parsed = JSON.parse(raw);
        const type = parsed['@type'] ?? parsed?.['@graph']?.[0]?.['@type'];
        if (type) jsonLdTypes.push(Array.isArray(type) ? type.join(', ') : type);
      } catch {}
    });
    result.jsonLd = {
      exists: jsonLdScripts.length > 0,
      types: jsonLdTypes,
      count: jsonLdScripts.length,
      raw: jsonLdScripts.slice(0, 3),
    };

    // Meta tags
    result.metaTags = {
      title: $('title').first().text() || null,
      description: $('meta[name="description"]').attr('content') ?? null,
      ogTitle: $('meta[property="og:title"]').attr('content') ?? null,
      ogDescription: $('meta[property="og:description"]').attr('content') ?? null,
      ogImage: $('meta[property="og:image"]').attr('content') ?? null,
      canonical: $('link[rel="canonical"]').attr('href') ?? null,
    };

    // Headings
    result.headings.h1 = $('h1')
      .map((_, el) => $(el).text().trim())
      .get()
      .slice(0, 5);
    result.headings.h2 = $('h2')
      .map((_, el) => $(el).text().trim())
      .get()
      .slice(0, 10);

    // Images alt
    const imgs = $('img');
    result.images.total = imgs.length;
    result.images.missingAlt = imgs.filter((_, el) => !$(el).attr('alt')).length;
  }

  // 이슈 & 점수 산정
  let score = 100;

  if (!result.llmsTxt.exists) {
    score -= 20;
    result.issues.push({
      title: 'llms.txt 파일 없음',
      detail: 'AI 모델이 사이트 구조를 파악할 수 없습니다. /llms.txt 생성을 권장합니다.',
      impact: 'High',
    });
  }
  if (!result.jsonLd.exists) {
    score -= 20;
    result.issues.push({
      title: 'JSON-LD 구조화 데이터 없음',
      detail: 'Product, FAQ, Article 타입의 Schema.org 마크업을 추가하세요.',
      impact: 'High',
    });
  } else if (!result.jsonLd.types.some((t) => ['Product', 'FAQPage', 'Article', 'Organization'].includes(t))) {
    score -= 10;
    result.issues.push({
      title: 'JSON-LD 타입 보강 필요',
      detail: `현재 타입: ${result.jsonLd.types.join(', ')}. FAQPage, Product 타입 추가를 권장합니다.`,
      impact: 'Medium',
    });
  }
  if (result.robotsTxt.llmBlocked) {
    score -= 15;
    result.issues.push({
      title: 'AI 봇 크롤링 차단됨',
      detail: 'robots.txt에서 GPTBot, ClaudeBot 등이 차단되어 있어 GEO 노출이 불가합니다.',
      impact: 'High',
    });
  }
  if (!result.metaTags.description) {
    score -= 10;
    result.issues.push({
      title: 'Meta Description 누락',
      detail: '검색 결과 스니펫에 표시될 설명이 없습니다.',
      impact: 'Medium',
    });
  }
  if (!result.metaTags.canonical) {
    score -= 5;
    result.issues.push({
      title: 'Canonical URL 누락',
      detail: '중복 콘텐츠 문제 방지를 위해 canonical 태그를 추가하세요.',
      impact: 'Low',
    });
  }
  if (result.images.missingAlt > 0) {
    score -= Math.min(10, result.images.missingAlt * 2);
    result.issues.push({
      title: `이미지 alt 속성 누락 (${result.images.missingAlt}개)`,
      detail: '접근성 및 SEO를 위해 모든 이미지에 alt 텍스트를 추가하세요.',
      impact: result.images.missingAlt > 5 ? 'High' : 'Medium',
    });
  }
  if (result.headings.h1.length === 0) {
    score -= 10;
    result.issues.push({
      title: 'H1 태그 없음',
      detail: '페이지당 하나의 H1 태그로 주제를 명확히 전달하세요.',
      impact: 'Medium',
    });
  }

  result.score = Math.max(0, score);

  return NextResponse.json(result);
}
