import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { auth } from '@/auth';
import { generateText } from '@/lib/ai';

async function safeFetch(url: string, timeout = 8000): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'GrowWeb-Bot/1.0 (SEO Analyzer)' },
    });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
}

function extractBrandInfo(html: string, url: string) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const origin = new URL(url).hostname.replace(/^www\./, '');
  const title = $('title').first().text().trim();
  const h1 = $('h1').first().text().trim();
  const description = $('meta[name="description"]').attr('content') ?? '';
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 6);
  const bodySnippet = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 800);
  return { origin, title, h1, description, h2s, bodySnippet };
}

export interface QuestionResult {
  question: string;
  answer: string;
  isMentioned: boolean;
  isRecommended: boolean;
  tone: 'positive' | 'neutral' | 'negative' | 'not_mentioned';
  score: number;
  analysis: string;
}

export interface AiSearchQualityResult {
  brandUrl: string;
  brandName: string;
  overallScore: number;
  questions: QuestionResult[];
  geoSignals: { label: string; status: 'good' | 'warning' | 'missing'; detail: string }[];
  recommendations: { priority: number; title: string; detail: string }[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { brandUrl, brandName: inputBrandName } = await req.json();
  if (!brandUrl?.trim()) return NextResponse.json({ error: 'brandUrl이 필요합니다.' }, { status: 400 });

  const fullUrl = brandUrl.startsWith('http') ? brandUrl : `https://${brandUrl}`;
  const pageRes = await safeFetch(fullUrl);
  if (!pageRes) return NextResponse.json({ error: `도메인에 연결할 수 없습니다 (${new URL(fullUrl).hostname}). URL을 확인하세요.` }, { status: 400 });
  if (!pageRes.ok) return NextResponse.json({ error: `페이지를 가져올 수 없습니다 (HTTP ${pageRes.status}).` }, { status: 400 });

  const html = await pageRes.text();
  const brand = extractBrandInfo(html, fullUrl);
  const brandName = inputBrandName?.trim() || brand.title.split(/[-|—·]/)[0].trim() || brand.origin;

  // AI에게 5개 질문 생성 요청
  const questionGenPrompt = `아래 브랜드/서비스 정보를 보고, 잠재 고객이 AI 검색(ChatGPT, Perplexity, Claude 등)에서 실제로 입력할 법한 질문 5개를 생성하세요.

브랜드: ${brandName}
도메인: ${brand.origin}
설명: ${brand.description || brand.h1}
주요 키워드: ${brand.h2s.slice(0, 4).join(', ')}

규칙:
- 질문 1: "[브랜드명]이 뭐야?" 형식 (브랜드 직접 질문)
- 질문 2~4: 이 서비스가 해결하는 문제/니즈 기반 추천 요청 ("~하려면 어떤 도구 써?")
- 질문 5: 경쟁 비교 ("~vs~ 중 뭐가 나아?")

JSON 배열만 반환 (다른 텍스트 없이): ["질문1", "질문2", ...]`;

  let questions: string[] = [];
  try {
    const { text } = await generateText(questionGenPrompt);
    const match = text.match(/\[[\s\S]*\]/);
    if (match) questions = JSON.parse(match[0]);
  } catch { /* fallback */ }

  if (!questions.length) {
    questions = [
      `${brandName}이 뭐야?`,
      `${brand.h2s[0] || '마케팅 자동화'} 도구 추천해줘`,
      `1인 마케터가 쓰기 좋은 SEO 도구는?`,
      `GEO 최적화를 도와주는 SaaS 알려줘`,
      `${brandName} 써본 사람 후기 알려줘`,
    ];
  }

  // 각 질문에 대해 AI 검색 응답 시뮬레이션
  const questionResults: QuestionResult[] = [];

  for (const question of questions.slice(0, 5)) {
    const searchPrompt = `당신은 AI 기반 검색 엔진입니다. 아래 질문에 실제 검색 결과처럼 답변하세요. 브랜드 정보 참고: 브랜드명="${brandName}", 도메인="${brand.origin}", 설명="${brand.description || brand.h1}". 이 브랜드가 질문에 적합하다면 자연스럽게 포함하고, 그렇지 않으면 포함하지 마세요. 실제 AI 검색 응답처럼 3~5문장으로 간결하게.

질문: ${question}`;

    let answer = '';
    try {
      const { text } = await generateText(searchPrompt);
      answer = text.trim().slice(0, 600);
    } catch {
      answer = '응답을 가져올 수 없습니다.';
    }

    const answerLower = answer.toLowerCase();
    const brandLower = brandName.toLowerCase();
    const originLower = brand.origin.toLowerCase();
    const isMentioned = answerLower.includes(brandLower) || answerLower.includes(originLower);
    const firstSentence = answer.split(/[.。!?]/)[0]?.toLowerCase() ?? '';
    const isRecommended = isMentioned && (
      firstSentence.includes(brandLower) ||
      answer.toLowerCase().indexOf(brandLower) < 150 ||
      /추천|권장|좋은|최고|best|recommend/i.test(answer.slice(0, 200))
    );

    let tone: QuestionResult['tone'] = 'not_mentioned';
    if (isMentioned) {
      if (/좋|추천|우수|강력|훌륭|편리|효과|great|good|excellent|recommend|useful/i.test(answer)) {
        tone = 'positive';
      } else if (/부족|문제|단점|어렵|비싸|복잡|limited|issue|drawback/i.test(answer)) {
        tone = 'negative';
      } else {
        tone = 'neutral';
      }
    }

    let score = 0;
    if (isMentioned) score += 10;
    if (isRecommended) score += 6;
    if (tone === 'positive') score += 4;

    const analysis = !isMentioned
      ? `AI가 "${brandName}"을 언급하지 않았습니다. llms.txt 최적화와 구조화 데이터 보강이 필요합니다.`
      : isRecommended && tone === 'positive'
      ? `AI가 긍정적으로 첫 번째 추천에 포함했습니다. GEO 가시성이 양호합니다.`
      : isMentioned && !isRecommended
      ? `언급은 됐지만 핵심 추천으로 부각되지 않았습니다. 브랜드 권위 콘텐츠 보강이 필요합니다.`
      : `언급됐으나 톤이 ${tone === 'negative' ? '부정적' : '중립적'}입니다. 긍정 리뷰·사례 콘텐츠를 늘려야 합니다.`;

    questionResults.push({ question, answer, isMentioned, isRecommended, tone, score, analysis });
  }

  const totalScore = questionResults.reduce((s, q) => s + q.score, 0);
  const maxScore = questionResults.length * 20;
  const overallScore = Math.round((totalScore / maxScore) * 100);

  // GEO 신호 체크 (이미 가져온 HTML 기반)
  const $ = cheerio.load(html);
  const hasLlmsTxt = !!(await safeFetch(`${new URL(fullUrl).origin}/llms.txt`, 4000))?.ok;
  const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
  const hasOrganizationSchema = (() => {
    let found = false;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const d = JSON.parse($(el).html() ?? '');
        const items = d['@graph'] ? d['@graph'] : [d];
        if (items.some((i: Record<string, unknown>) => ['Organization', 'LocalBusiness', 'Corporation'].includes(String(i['@type'])))) found = true;
      } catch { /* */ }
    });
    return found;
  })();
  const hasFaq = $('script[type="application/ld+json"]').toArray().some((el) => {
    try { const d = JSON.parse($(el).html() ?? ''); return String(d['@type']) === 'FAQPage'; } catch { return false; }
  });
  const wordCount = $('body').text().replace(/\s+/g, ' ').split(' ').filter(Boolean).length;

  const geoSignals: AiSearchQualityResult['geoSignals'] = [
    {
      label: 'llms.txt',
      status: hasLlmsTxt ? 'good' : 'missing',
      detail: hasLlmsTxt ? 'AI 봇이 사이트 구조를 파악할 수 있습니다.' : 'AI 봇 접근성 파일이 없습니다. GEO 가시성의 핵심 요소입니다.',
    },
    {
      label: 'Organization 스키마',
      status: hasOrganizationSchema ? 'good' : 'missing',
      detail: hasOrganizationSchema ? '브랜드 정보가 구조화되어 AI에게 명확하게 전달됩니다.' : 'AI가 브랜드 정체성을 이해하기 어렵습니다. Organization JSON-LD를 추가하세요.',
    },
    {
      label: 'FAQ 스키마',
      status: hasFaq ? 'good' : 'warning',
      detail: hasFaq ? 'Q&A 형식이 AI 검색 스니펫에 활용됩니다.' : 'FAQ 콘텐츠가 없으면 AI가 질문-답변 형식으로 인용하기 어렵습니다.',
    },
    {
      label: 'JSON-LD 구조화 데이터',
      status: hasJsonLd ? 'good' : 'missing',
      detail: hasJsonLd ? '구조화 데이터가 있어 AI 파싱 정확도가 높습니다.' : '구조화 데이터 없이는 AI가 페이지 목적을 추측에 의존합니다.',
    },
    {
      label: '콘텐츠 깊이',
      status: wordCount >= 800 ? 'good' : wordCount >= 400 ? 'warning' : 'missing',
      detail: wordCount >= 800
        ? `${wordCount}단어로 AI 인용 가능한 충분한 콘텐츠가 있습니다.`
        : `${wordCount}단어는 AI 인용이 부족합니다. 최소 800단어 이상의 심층 콘텐츠가 필요합니다.`,
    },
  ];

  // AI 개선 권고 생성
  const recPrompt = `GEO(AI 검색 최적화) 진단 결과를 보고 우선 개선 사항 3가지를 한국어로 제시하세요.

브랜드: ${brandName} (${brand.origin})
AI 검색 응답 점수: ${overallScore}/100
AI 언급 비율: ${questionResults.filter((q) => q.isMentioned).length}/${questionResults.length}개 질문
미언급 질문 예시: ${questionResults.filter((q) => !q.isMentioned).map((q) => q.question).slice(0, 2).join(', ')}
GEO 신호 누락: ${geoSignals.filter((s) => s.status !== 'good').map((s) => s.label).join(', ')}

JSON 배열만 반환: [{"priority":1,"title":"제목","detail":"2문장 설명"}, ...]`;

  let recommendations: AiSearchQualityResult['recommendations'] = [];
  try {
    const { text } = await generateText(recPrompt);
    const match = text.match(/\[[\s\S]*\]/);
    if (match) recommendations = JSON.parse(match[0]);
  } catch { /* fallback */ }

  if (!recommendations.length) {
    recommendations = geoSignals
      .filter((s) => s.status !== 'good')
      .slice(0, 3)
      .map((s, i) => ({ priority: i + 1, title: `${s.label} 개선`, detail: s.detail }));
  }

  return NextResponse.json({
    brandUrl: fullUrl,
    brandName,
    overallScore,
    questions: questionResults,
    geoSignals,
    recommendations,
  } satisfies AiSearchQualityResult);
}
