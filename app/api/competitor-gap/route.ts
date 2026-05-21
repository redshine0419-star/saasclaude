import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { generateText } from '@/lib/ai';

async function safeFetch(url: string, timeout = 8000): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'GrowWeb-Bot/1.0 (Competitor Analyzer)' },
    });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
}

function extractPageProfile(html: string, url: string) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const origin = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
  const title = $('title').first().text().trim();
  const h1 = $('h1').map((_, el) => $(el).text().trim()).get().join(' / ');
  const description = $('meta[name="description"]').attr('content') ?? '';
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 10);
  const h3s = $('h3').map((_, el) => $(el).text().trim()).get().slice(0, 8);
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(' ').filter(Boolean).length;
  const snippet = bodyText.slice(0, 600);
  const internalLinks = $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') ?? '';
    return href.startsWith('/') || href.startsWith(url);
  }).length;
  const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
  const jsonLdTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).html() ?? '');
      const items = d['@graph'] ? d['@graph'] : [d];
      items.forEach((i: Record<string, unknown>) => {
        if (i['@type']) jsonLdTypes.push(String(i['@type']));
      });
    } catch { /* */ }
  });

  return { origin, title, h1, description, h2s, h3s, wordCount, snippet, internalLinks, hasJsonLd, jsonLdTypes };
}

export interface GapTopic {
  topic: string;
  competitorHas: boolean;
  ourHas: boolean;
  importance: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface ContentRecommendation {
  title: string;
  keyword: string;
  format: string;
  reason: string;
  estimatedImpact: 'High' | 'Medium' | 'Low';
}

export interface CompetitorGapResult {
  ourUrl: string;
  competitorUrl: string;
  ourProfile: { origin: string; wordCount: number; h2Count: number; hasJsonLd: boolean };
  competitorProfile: { origin: string; wordCount: number; h2Count: number; hasJsonLd: boolean };
  gapScore: number;
  topics: GapTopic[];
  contentRecommendations: ContentRecommendation[];
  ourAdvantages: string[];
  summary: string;
}

export async function POST(req: NextRequest) {
  const { ourUrl, competitorUrl } = await req.json();
  if (!ourUrl?.trim() || !competitorUrl?.trim()) {
    return NextResponse.json({ error: 'ourUrl과 competitorUrl이 모두 필요합니다.' }, { status: 400 });
  }

  const normalize = (u: string) => u.startsWith('http') ? u : `https://${u}`;
  const [ourRes, compRes] = await Promise.all([
    safeFetch(normalize(ourUrl)),
    safeFetch(normalize(competitorUrl)),
  ]);

  if (!ourRes?.ok) return NextResponse.json({ error: '우리 사이트를 가져올 수 없습니다.' }, { status: 400 });
  if (!compRes?.ok) return NextResponse.json({ error: '경쟁사 사이트를 가져올 수 없습니다.' }, { status: 400 });

  const [ourHtml, compHtml] = await Promise.all([ourRes.text(), compRes.text()]);
  const ours = extractPageProfile(ourHtml, normalize(ourUrl));
  const comp = extractPageProfile(compHtml, normalize(competitorUrl));

  const gapPrompt = `당신은 시니어 SEO/콘텐츠 전략가입니다. 두 웹사이트를 분석하고 콘텐츠 갭을 진단하세요.

=== 우리 사이트 (${ours.origin}) ===
Title: ${ours.title}
H1: ${ours.h1}
Description: ${ours.description}
H2 소제목: ${ours.h2s.join(' | ')}
H3 소제목: ${ours.h3s.join(' | ')}
단어 수: ${ours.wordCount}
구조화 데이터: ${ours.hasJsonLd ? ours.jsonLdTypes.join(', ') : '없음'}
본문 샘플: ${ours.snippet}

=== 경쟁사 (${comp.origin}) ===
Title: ${comp.title}
H1: ${comp.h1}
Description: ${comp.description}
H2 소제목: ${comp.h2s.join(' | ')}
H3 소제목: ${comp.h3s.join(' | ')}
단어 수: ${comp.wordCount}
구조화 데이터: ${comp.hasJsonLd ? comp.jsonLdTypes.join(', ') : '없음'}
본문 샘플: ${comp.snippet}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "gapScore": 0~100 (경쟁사 대비 우리 콘텐츠 갭 크기. 100=격차 매우 큼, 0=우리가 우세),
  "topics": [
    {
      "topic": "주제명",
      "competitorHas": true/false,
      "ourHas": true/false,
      "importance": "High|Medium|Low",
      "reason": "이 주제가 중요한 이유 1문장"
    }
  ],
  "contentRecommendations": [
    {
      "title": "콘텐츠 제목 (SEO 최적화된)",
      "keyword": "핵심 타깃 키워드",
      "format": "블로그 가이드|인포그래픽|FAQ|사례 연구|비교 글",
      "reason": "왜 이 콘텐츠를 만들어야 하는지 1문장",
      "estimatedImpact": "High|Medium|Low"
    }
  ],
  "ourAdvantages": ["우리 사이트가 경쟁사보다 나은 점 1", "..."],
  "summary": "두 사이트 비교 전체 요약 3문장"
}

topics는 5~8개, contentRecommendations는 4~6개, ourAdvantages는 2~4개`;

  let aiResult: {
    gapScore: number;
    topics: GapTopic[];
    contentRecommendations: ContentRecommendation[];
    ourAdvantages: string[];
    summary: string;
  } | null = null;

  try {
    const { text } = await generateText(gapPrompt);
    // strip markdown code fences if present
    const clean = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) aiResult = JSON.parse(match[0]);
  } catch { /* fallback */ }

  if (!aiResult) {
    aiResult = {
      gapScore: 50,
      topics: [],
      contentRecommendations: [],
      ourAdvantages: [],
      summary: 'AI 분석을 완료할 수 없었습니다. 다시 시도해 주세요.',
    };
  }

  return NextResponse.json({
    ourUrl: normalize(ourUrl),
    competitorUrl: normalize(competitorUrl),
    ourProfile: { origin: ours.origin, wordCount: ours.wordCount, h2Count: ours.h2s.length, hasJsonLd: ours.hasJsonLd },
    competitorProfile: { origin: comp.origin, wordCount: comp.wordCount, h2Count: comp.h2s.length, hasJsonLd: comp.hasJsonLd },
    gapScore: aiResult.gapScore,
    topics: aiResult.topics,
    contentRecommendations: aiResult.contentRecommendations,
    ourAdvantages: aiResult.ourAdvantages,
    summary: aiResult.summary,
  } satisfies CompetitorGapResult);
}
