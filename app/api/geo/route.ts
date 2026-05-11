import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface GeoResult {
  meta: {
    title: string | null;
    titleLength: number;
    description: string | null;
    descriptionLength: number;
    viewport: string | null;
    lang: string | null;
    charset: string | null;
    author: string | null;
    articlePublished: string | null;
    articleModified: string | null;
    robotsMeta: string | null;
    isNoindex: boolean;
    canonical: string | null;
  };
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    url: string | null;
    twitterCard: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    twitterImage: string | null;
  };
  headings: {
    h1: string[];
    h1Count: number;
    h2: string[];
    h2Count: number;
    h3Count: number;
  };
  content: {
    wordCount: number;
    internalLinks: number;
    externalLinks: number;
    nofollowLinks: number;
    isHttps: boolean;
    hasFavicon: boolean;
  };
  images: { total: number; missingAlt: number };
  jsonLd: {
    exists: boolean;
    count: number;
    types: string[];
    hasFaq: boolean;
    hasArticle: boolean;
    hasBreadcrumb: boolean;
    hasProduct: boolean;
    hasOrganization: boolean;
    hasHowTo: boolean;
    raw: string[];
  };
  llmsTxt: { exists: boolean };
  robotsTxt: { exists: boolean; llmBlocked: boolean; hasSitemap: boolean };
  sitemap: { exists: boolean };
  score: number;
  issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
}

async function safeFetch(url: string, timeout = 8000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MarketerOps-Bot/1.0 (SEO Analyzer)' },
    });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return NextResponse.json({ error: '유효하지 않은 URL입니다.' }, { status: 400 });
  }

  const [pageRes, llmsRes, robotsRes, sitemapRes] = await Promise.all([
    safeFetch(url),
    safeFetch(`${origin}/llms.txt`),
    safeFetch(`${origin}/robots.txt`),
    safeFetch(`${origin}/sitemap.xml`, 5000),
  ]);

  const result: GeoResult = {
    meta: {
      title: null, titleLength: 0,
      description: null, descriptionLength: 0,
      viewport: null, lang: null, charset: null, author: null,
      articlePublished: null, articleModified: null,
      robotsMeta: null, isNoindex: false, canonical: null,
    },
    og: {
      title: null, description: null, image: null, type: null, url: null,
      twitterCard: null, twitterTitle: null, twitterDescription: null, twitterImage: null,
    },
    headings: { h1: [], h1Count: 0, h2: [], h2Count: 0, h3Count: 0 },
    content: { wordCount: 0, internalLinks: 0, externalLinks: 0, nofollowLinks: 0, isHttps: url.startsWith('https://'), hasFavicon: false },
    images: { total: 0, missingAlt: 0 },
    jsonLd: { exists: false, count: 0, types: [], hasFaq: false, hasArticle: false, hasBreadcrumb: false, hasProduct: false, hasOrganization: false, hasHowTo: false, raw: [] },
    llmsTxt: { exists: !!(llmsRes && llmsRes.ok) },
    robotsTxt: { exists: false, llmBlocked: false, hasSitemap: false },
    sitemap: { exists: !!(sitemapRes && sitemapRes.ok) },
    score: 0,
    issues: [],
  };

  // robots.txt
  if (robotsRes && robotsRes.ok) {
    const txt = await robotsRes.text();
    result.robotsTxt.exists = true;
    const lower = txt.toLowerCase();
    result.robotsTxt.llmBlocked = lower.includes('gptbot') || lower.includes('claudebot') || lower.includes('anthropic') || lower.includes('chatgpt');
    result.robotsTxt.hasSitemap = lower.includes('sitemap:');
  }

  // HTML 파싱
  if (pageRes && pageRes.ok) {
    const html = await pageRes.text();
    const $ = cheerio.load(html);

    // lang
    result.meta.lang = $('html').attr('lang') ?? null;

    // charset
    result.meta.charset =
      $('meta[charset]').attr('charset') ??
      $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^\s;]+)/i)?.[1] ??
      null;

    // title
    const titleText = $('title').first().text().trim();
    result.meta.title = titleText || null;
    result.meta.titleLength = titleText.length;

    // meta tags
    result.meta.description = $('meta[name="description"]').attr('content') ?? null;
    result.meta.descriptionLength = result.meta.description?.length ?? 0;
    result.meta.viewport = $('meta[name="viewport"]').attr('content') ?? null;
    result.meta.author = $('meta[name="author"]').attr('content') ?? null;
    result.meta.articlePublished = $('meta[property="article:published_time"]').attr('content') ?? null;
    result.meta.articleModified = $('meta[property="article:modified_time"]').attr('content') ?? null;
    result.meta.canonical = $('link[rel="canonical"]').attr('href') ?? null;

    const robotsMeta = $('meta[name="robots"]').attr('content') ?? null;
    result.meta.robotsMeta = robotsMeta;
    result.meta.isNoindex = !!(robotsMeta && robotsMeta.toLowerCase().includes('noindex'));

    // OG tags
    result.og.title = $('meta[property="og:title"]').attr('content') ?? null;
    result.og.description = $('meta[property="og:description"]').attr('content') ?? null;
    result.og.image = $('meta[property="og:image"]').attr('content') ?? null;
    result.og.type = $('meta[property="og:type"]').attr('content') ?? null;
    result.og.url = $('meta[property="og:url"]').attr('content') ?? null;
    result.og.twitterCard = $('meta[name="twitter:card"]').attr('content') ?? null;
    result.og.twitterTitle = $('meta[name="twitter:title"]').attr('content') ?? null;
    result.og.twitterDescription = $('meta[name="twitter:description"]').attr('content') ?? null;
    result.og.twitterImage = $('meta[name="twitter:image"]').attr('content') ?? null;

    // Favicon
    result.content.hasFavicon = !!(
      $('link[rel="icon"]').length ||
      $('link[rel="shortcut icon"]').length ||
      $('link[rel="apple-touch-icon"]').length
    );

    // Headings
    result.headings.h1 = $('h1').map((_, el) => $(el).text().trim()).get().slice(0, 5);
    result.headings.h1Count = $('h1').length;
    result.headings.h2 = $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 8);
    result.headings.h2Count = $('h2').length;
    result.headings.h3Count = $('h3').length;

    // Images
    const imgs = $('img');
    result.images.total = imgs.length;
    result.images.missingAlt = imgs.filter((_, el) => !$(el).attr('alt')).length;

    // Links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const rel = $(el).attr('rel') ?? '';
      if (rel.includes('nofollow')) result.content.nofollowLinks++;
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('/') || href.startsWith(origin)) {
        result.content.internalLinks++;
      } else if (href.startsWith('http')) {
        result.content.externalLinks++;
      }
    });

    // Word count (body text, excluding scripts/styles)
    $('script, style, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    result.content.wordCount = bodyText.split(' ').filter(Boolean).length;

    // JSON-LD
    const jsonLdTypes: string[] = [];
    const jsonLdRaw: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).html() ?? '';
      jsonLdRaw.push(raw.trim().slice(0, 300));
      try {
        const parsed = JSON.parse(raw);
        const items = parsed['@graph'] ? parsed['@graph'] : [parsed];
        items.forEach((item: Record<string, unknown>) => {
          const t = item['@type'];
          if (t) {
            const types = Array.isArray(t) ? t : [String(t)];
            jsonLdTypes.push(...types);
          }
        });
      } catch {}
    });
    const uniqueTypes = [...new Set(jsonLdTypes)];
    result.jsonLd = {
      exists: jsonLdRaw.length > 0,
      count: jsonLdRaw.length,
      types: uniqueTypes,
      hasFaq: uniqueTypes.some((t) => t === 'FAQPage'),
      hasArticle: uniqueTypes.some((t) => ['Article', 'BlogPosting', 'NewsArticle'].includes(t)),
      hasBreadcrumb: uniqueTypes.some((t) => t === 'BreadcrumbList'),
      hasProduct: uniqueTypes.some((t) => t === 'Product'),
      hasOrganization: uniqueTypes.some((t) => ['Organization', 'LocalBusiness', 'Corporation'].includes(t)),
      hasHowTo: uniqueTypes.some((t) => t === 'HowTo'),
      raw: jsonLdRaw.slice(0, 3),
    };
  }

  // 점수 & 이슈 산정
  let score = 100;

  const deduct = (pts: number, title: string, detail: string, impact: 'High' | 'Medium' | 'Low') => {
    score -= pts;
    result.issues.push({ title, detail, impact });
  };

  // HTTPS
  if (!result.content.isHttps) deduct(20, 'HTTPS 미적용', '검색엔진은 HTTP 사이트를 보안 위험으로 표시합니다. SSL 인증서를 즉시 적용하세요.', 'High');

  // noindex
  if (result.meta.isNoindex) deduct(25, 'Noindex 메타 태그 감지', '검색엔진이 이 페이지를 색인하지 않습니다. 의도적이 아니라면 즉시 제거하세요.', 'High');

  // viewport
  if (!result.meta.viewport) deduct(15, 'Viewport 메타 태그 없음', '모바일 검색 순위에 직접 영향. <meta name="viewport" content="width=device-width, initial-scale=1"> 추가 필수.', 'High');

  // title
  if (!result.meta.title) {
    deduct(15, 'Title 태그 없음', '검색 결과 제목 표시 불가. 페이지마다 고유한 Title을 반드시 작성하세요.', 'High');
  } else if (result.meta.titleLength < 10) {
    deduct(10, 'Title 너무 짧음 (' + result.meta.titleLength + '자)', '검색 결과에서 키워드 노출이 불리합니다. 30~60자를 권장합니다.', 'Medium');
  } else if (result.meta.titleLength > 60) {
    deduct(8, 'Title 너무 김 (' + result.meta.titleLength + '자)', '60자 초과 시 검색 결과에서 잘려 보입니다. 50~60자로 단축하세요.', 'Medium');
  }

  // meta description
  if (!result.meta.description) {
    deduct(10, 'Meta Description 없음', '검색 결과 스니펫이 자동 추출됩니다. 클릭률(CTR) 하락 원인. 150~160자로 작성하세요.', 'Medium');
  } else if (result.meta.descriptionLength < 70) {
    deduct(5, 'Meta Description 너무 짧음 (' + result.meta.descriptionLength + '자)', '150~160자로 키워드와 행동 유도 문구를 포함하세요.', 'Low');
  } else if (result.meta.descriptionLength > 160) {
    deduct(5, 'Meta Description 너무 김 (' + result.meta.descriptionLength + '자)', '160자 초과 시 잘려서 표시됩니다.', 'Low');
  }

  // lang
  if (!result.meta.lang) deduct(8, 'HTML lang 속성 없음', '<html lang="ko"> 형태로 언어를 명시하세요. 다국어 SEO 및 스크린리더 접근성에 필수입니다.', 'Medium');

  // H1
  if (result.headings.h1Count === 0) {
    deduct(15, 'H1 태그 없음', '페이지 주제를 나타내는 H1 태그가 필수입니다. 핵심 키워드를 포함하여 작성하세요.', 'High');
  } else if (result.headings.h1Count > 1) {
    deduct(8, 'H1 태그 중복 (' + result.headings.h1Count + '개)', 'H1은 페이지당 정확히 1개여야 합니다. 나머지는 H2로 변경하세요.', 'Medium');
  }

  // H2
  if (result.headings.h2Count === 0) deduct(8, 'H2 태그 없음', '콘텐츠 구조화를 위해 H2 소제목을 추가하세요. 검색엔진이 페이지 구조를 파악하는 핵심 신호입니다.', 'Medium');

  // Word count
  if (result.content.wordCount < 300) {
    deduct(10, '콘텐츠 너무 짧음 (약 ' + result.content.wordCount + '단어)', '300단어 미만은 얕은 콘텐츠로 평가됩니다. 1,000단어 이상의 심층 콘텐츠를 권장합니다.', 'Medium');
  }

  // Internal links
  if (result.content.internalLinks === 0) deduct(5, '내부 링크 없음', '관련 페이지로 연결하는 내부 링크 3개 이상을 추가하세요. 페이지 권위 분산과 크롤링 효율에 중요합니다.', 'Low');

  // OG tags
  const ogScore = [result.og.title, result.og.description, result.og.image].filter(Boolean).length;
  if (ogScore === 0) {
    deduct(8, 'Open Graph 태그 없음', 'SNS 공유 시 미리보기가 표시되지 않습니다. og:title, og:description, og:image를 추가하세요.', 'Medium');
  } else if (ogScore < 3) {
    deduct(4, 'Open Graph 태그 불완전 (' + ogScore + '/3)', '누락된 OG 태그: ' + (['og:title', 'og:description', 'og:image'].filter((_, i) => ![result.og.title, result.og.description, result.og.image][i]).join(', ')), 'Low');
  }

  // Twitter card
  if (!result.og.twitterCard) deduct(5, 'Twitter Card 태그 없음', 'X(트위터) 공유 시 미리보기 없음. <meta name="twitter:card" content="summary_large_image"> 추가를 권장합니다.', 'Low');

  // JSON-LD
  if (!result.jsonLd.exists) {
    deduct(15, '구조화 데이터(JSON-LD) 없음', '리치 스니펫(별점, FAQ, 가격 등) 표시 불가. Schema.org 마크업을 추가하세요.', 'High');
  } else {
    if (!result.jsonLd.hasFaq) deduct(3, 'FAQPage 스키마 없음', 'FAQ 콘텐츠가 있다면 FAQPage 스키마를 추가해 검색 결과에서 질문/답변을 직접 표시하세요.', 'Low');
    if (!result.jsonLd.hasBreadcrumb) deduct(3, 'BreadcrumbList 스키마 없음', '검색 결과 URL 경로 표시용 Breadcrumb 스키마를 추가하세요.', 'Low');
  }

  // Sitemap
  if (!result.sitemap.exists && !result.robotsTxt.hasSitemap) deduct(10, 'Sitemap 없음', '/sitemap.xml 파일을 생성하고 Google Search Console에 제출하세요. 신규 페이지 색인 속도에 직접 영향.', 'Medium');

  // Canonical
  if (!result.meta.canonical) deduct(5, 'Canonical URL 없음', '중복 URL(파라미터, www 유무)로 인한 중복 콘텐츠 문제를 방지하려면 canonical 태그가 필요합니다.', 'Low');

  // Images alt
  if (result.images.missingAlt > 0) {
    deduct(Math.min(10, result.images.missingAlt * 2), '이미지 Alt 누락 (' + result.images.missingAlt + '/' + result.images.total + '개)', '이미지 검색 노출과 접근성을 위해 모든 이미지에 설명적인 alt 텍스트를 작성하세요.', result.images.missingAlt > 5 ? 'Medium' : 'Low');
  }

  // Favicon
  if (!result.content.hasFavicon) deduct(3, 'Favicon 없음', '브라우저 탭과 북마크에 표시되는 파비콘이 없습니다. 브랜드 신뢰도에 영향을 줍니다.', 'Low');

  // llms.txt
  if (!result.llmsTxt.exists) deduct(10, 'llms.txt 없음', 'AI 봇이 사이트 구조를 파악할 수 없습니다. GEO(Generative Engine Optimization) 노출 저하 원인.', 'Medium');

  // AI bot blocked
  if (result.robotsTxt.llmBlocked) deduct(12, 'AI 봇 크롤링 차단', 'GPTBot/ClaudeBot이 차단되어 ChatGPT, Claude 등 AI 서비스의 검색 결과에 노출되지 않습니다.', 'High');

  result.score = Math.max(0, score);
  return NextResponse.json(result);
}
