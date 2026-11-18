import type { MetadataRoute } from 'next';

const PRIVATE = ['/platform/', '/api/', '/*/admin/', '/account/', '/auth/', '/consult/result/', '/r/'];

/**
 * 검색엔진과 AI 검색 수집기(GEO) — 공개 페이지는 모두 허용하고 관리·개인 화면만 막는다.
 * AI 수집기는 이름으로도 적어 둔다(일부 사이트 설정 도구가 이름별 규칙만 보기 때문).
 */
const AI_AND_SEARCH_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', // OpenAI
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', // Anthropic
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Googlebot',
  'Bingbot',
  'Yeti', // 네이버
  'Daum', 'Daumoa', // 다음
  'Applebot', 'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  return {
    rules: [
      { userAgent: AI_AND_SEARCH_BOTS, allow: '/', disallow: PRIVATE },
      { userAgent: '*', allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
