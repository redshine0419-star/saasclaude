import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { generateText } from '@/lib/ai';

const MAX_URLS = 20;
const CONCURRENCY = 4;
const FETCH_TIMEOUT = 8000;

async function safeFetch(url: string, timeout = FETCH_TIMEOUT): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'GrowWeb-Bot/1.0 (SEO Bulk Analyzer)' },
    });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
}

// Sitemap XML에서 URL 목록 추출 (sitemapindex 1단계 탐색 포함)
async function extractUrls(sitemapUrl: string): Promise<string[]> {
  const res = await safeFetch(sitemapUrl, 10000);
  if (!res || !res.ok) return [];
  const text = await res.text();

  // sitemap index → 첫 번째 자식 sitemap 탐색
  if (text.includes('<sitemapindex')) {
    const subUrls = [...text.matchAll(/<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    const results: string[] = [];
    for (const sub of subUrls.slice(0, 4)) {
      const more = await extractUrls(sub);
      results.push(...more);
      if (results.length >= MAX_URLS) break;
    }
    return results.slice(0, MAX_URLS);
  }

  // 일반 sitemap
  return [...text.matchAll(/<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi)]
    .map((m) => m[1])
    .filter((u) => !u.endsWith('.xml') && !u.endsWith('.gz'))
    .slice(0, MAX_URLS);
}

export interface PageScore {
  url: string;
  score: number;
  status: 'ok' | 'error' | 'timeout';
  title: string | null;
  h1: string | null;
  wordCount: number;
  issues: { title: string; impact: 'High' | 'Medium' | 'Low' }[];
  hasJsonLd: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  hasDescription: boolean;
}

function computeScore(url: string, html: string): PageScore {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();

  const title = $('title').first().text().trim() || null;
  const titleLen = title?.length ?? 0;
  const description = $('meta[name="description"]').attr('content') ?? null;
  const descLen = description?.length ?? 0;
  const h1els = $('h1');
  const h1Count = h1els.length;
  const h1Text = h1els.first().text().trim() || null;
  const h2Count = $('h2').length;
  const lang = $('html').attr('lang') ?? null;
  const canonical = $('link[rel="canonical"]').attr('href') ?? null;
  const viewport = $('meta[name="viewport"]').attr('content') ?? null;
  const ogTitle = $('meta[property="og:title"]').attr('content') ?? null;
  const ogDesc = $('meta[property="og:description"]').attr('content') ?? null;
  const ogImage = $('meta[property="og:image"]').attr('content') ?? null;
  const jsonLd = $('script[type="application/ld+json"]').length > 0;
  const wordCount = ($('body').text().replace(/\s+/g, ' ').trim()).split(' ').filter(Boolean).length;
  const internalLinks = $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') ?? '';
    try { return href.startsWith('/') || href.startsWith(new URL(url).origin); } catch { return false; }
  }).length;

  const issues: { title: string; impact: 'High' | 'Medium' | 'Low' }[] = [];
  let score = 100;

  const deduct = (pts: number, msg: string, imp: 'High' | 'Medium' | 'Low') => {
    score -= pts;
    issues.push({ title: msg, impact: imp });
  };

  if (!title) deduct(15, 'Title 태그 없음', 'High');
  else if (titleLen < 10 || titleLen > 65) deduct(8, `Title 길이 부적절 (${titleLen}자)`, 'Medium');

  if (!description) deduct(10, 'Meta Description 없음', 'Medium');
  else if (descLen < 70 || descLen > 160) deduct(5, `Description 길이 부적절 (${descLen}자)`, 'Low');

  if (!viewport) deduct(12, 'Viewport 없음', 'High');
  if (h1Count === 0) deduct(15, 'H1 태그 없음', 'High');
  else if (h1Count > 1) deduct(8, `H1 중복 (${h1Count}개)`, 'Medium');
  if (h2Count === 0) deduct(8, 'H2 태그 없음', 'Medium');
  if (!lang) deduct(8, 'HTML lang 없음', 'Medium');
  if (!canonical) deduct(5, 'Canonical URL 없음', 'Low');
  if (!jsonLd) deduct(15, 'JSON-LD 구조화 데이터 없음', 'High');
  if (!ogTitle || !ogDesc || !ogImage) deduct(8, 'OG 태그 불완전', 'Medium');
  if (wordCount < 300) deduct(10, `콘텐츠 부족 (${wordCount}단어)`, 'Medium');
  if (internalLinks < 2) deduct(5, '내부 링크 부족', 'Low');

  return {
    url,
    score: Math.max(0, score),
    status: 'ok',
    title,
    h1: h1Text,
    wordCount,
    issues: issues.slice(0, 4),
    hasJsonLd: jsonLd,
    hasCanonical: !!canonical,
    hasOg: !!(ogTitle && ogDesc && ogImage),
    hasDescription: !!description,
  };
}

async function analyzeUrl(url: string): Promise<PageScore> {
  const res = await safeFetch(url);
  if (!res) return { url, score: 0, status: 'timeout', title: null, h1: null, wordCount: 0, issues: [{ title: '페이지 응답 없음', impact: 'High' }], hasJsonLd: false, hasCanonical: false, hasOg: false, hasDescription: false };
  if (!res.ok) return { url, score: 0, status: 'error', title: null, h1: null, wordCount: 0, issues: [{ title: `HTTP ${res.status}`, impact: 'High' }], hasJsonLd: false, hasCanonical: false, hasOg: false, hasDescription: false };
  const html = await res.text();
  return computeScore(url, html);
}

// 동시성 제한 배치 실행
async function batchAnalyze(urls: string[]): Promise<PageScore[]> {
  const results: PageScore[] = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(analyzeUrl));
    results.push(...batchResults);
  }
  return results;
}

export async function POST(req: NextRequest) {
  const { siteUrl } = await req.json();
  if (!siteUrl?.trim()) return NextResponse.json({ error: 'siteUrl이 필요합니다.' }, { status: 400 });

  let origin: string;
  try {
    origin = new URL(siteUrl.startsWith('http') ? siteUrl : 'https://' + siteUrl).origin;
  } catch {
    return NextResponse.json({ error: '유효하지 않은 URL입니다.' }, { status: 400 });
  }

  // 사이트맵 후보 순서대로 시도
  const sitemapCandidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ];

  let urls: string[] = [];
  let sitemapUrl = '';

  // robots.txt에서 Sitemap 행 탐색
  try {
    const robotsRes = await safeFetch(`${origin}/robots.txt`, 5000);
    if (robotsRes?.ok) {
      const txt = await robotsRes.text();
      const sitemapLine = txt.split('\n').find((l) => /^sitemap:/i.test(l.trim()));
      if (sitemapLine) {
        const discovered = sitemapLine.replace(/^sitemap:\s*/i, '').trim();
        sitemapCandidates.unshift(discovered);
      }
    }
  } catch { /* continue */ }

  for (const candidate of sitemapCandidates) {
    const extracted = await extractUrls(candidate);
    if (extracted.length > 0) {
      urls = extracted;
      sitemapUrl = candidate;
      break;
    }
  }

  if (urls.length === 0) {
    // Return a structured error the component can detect
    return NextResponse.json({
      error: 'SITEMAP_NOT_FOUND',
      message: '사이트맵을 찾을 수 없습니다. sitemap.xml이 없거나 robots.txt에 Sitemap 경로가 선언되지 않았습니다. sitemap.xml URL을 직접 입력해 보세요.',
    }, { status: 404 });
  }

  // 분석 실행
  const pages = await batchAnalyze(urls);
  const okPages = pages.filter((p) => p.status === 'ok');
  const avgScore = okPages.length > 0
    ? Math.round(okPages.reduce((s, p) => s + p.score, 0) / okPages.length)
    : 0;

  const distribution = {
    good: pages.filter((p) => p.score >= 70).length,
    warning: pages.filter((p) => p.score >= 40 && p.score < 70).length,
    critical: pages.filter((p) => p.score < 40).length,
  };

  // 이슈 빈도 집계
  const issueCount: Record<string, { count: number; impact: 'High' | 'Medium' | 'Low' }> = {};
  for (const page of okPages) {
    for (const issue of page.issues) {
      if (!issueCount[issue.title]) issueCount[issue.title] = { count: 0, impact: issue.impact };
      issueCount[issue.title].count++;
    }
  }
  const topIssues = Object.entries(issueCount)
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => {
      const impOrder = { High: 0, Medium: 1, Low: 2 };
      return impOrder[a.impact] - impOrder[b.impact] || b.count - a.count;
    })
    .slice(0, 8);

  // AI 사이트 전체 요약
  const worstPages = [...pages].sort((a, b) => a.score - b.score).slice(0, 5);
  const prompt = `당신은 SEO·GEO 전문가입니다. 아래 웹사이트 일괄 진단 결과를 보고, 사이트 전체 수준의 우선 개선 사항 3가지를 간결하게 한국어로 작성하세요. 각 항목은 원인·해결책·기대효과 포함 2~3문장으로.

사이트: ${origin}
분석 페이지: ${pages.length}개 | 평균 GEO 점수: ${avgScore}점
점수 분포: 양호(70+) ${distribution.good}개 / 주의(40-69) ${distribution.warning}개 / 위험(~39) ${distribution.critical}개
가장 낮은 점수 페이지: ${worstPages.map((p) => `${p.url} (${p.score}점)`).join(', ')}
사이트 공통 이슈 Top3: ${topIssues.slice(0, 3).map((i) => `${i.title}(${i.count}개 페이지)`).join(', ')}

응답 형식 (JSON 배열, 다른 텍스트 없이):
[{"priority": 1, "title": "개선 제목", "detail": "설명 2~3문장"}, ...]`;

  let aiRecommendations: { priority: number; title: string; detail: string }[] = [];
  try {
    const { text } = await generateText(prompt);
    const clean = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) aiRecommendations = JSON.parse(match[0]);
  } catch { /* fallback */ }

  if (aiRecommendations.length === 0) {
    aiRecommendations = topIssues.slice(0, 3).map((issue, i) => ({
      priority: i + 1,
      title: issue.title,
      detail: `${issue.count}개 페이지에서 발견됐습니다. 영향도 ${issue.impact}.`,
    }));
  }

  return NextResponse.json({
    siteUrl: origin,
    sitemapUrl,
    totalUrls: urls.length,
    analyzedUrls: pages.length,
    avgScore,
    distribution,
    topIssues,
    pages: pages.sort((a, b) => a.score - b.score),
    aiRecommendations,
  });
}
