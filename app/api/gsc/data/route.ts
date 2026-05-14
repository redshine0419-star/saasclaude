import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidGSCToken } from '@/lib/gsc-tokens';

interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: object
) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `GSC API 오류 (${res.status})`);
  return (data.rows ?? []) as GSCRow[];
}

// AI Overview 피해 감지: 노출↑·순위↑·CTR 급감 패턴
function detectAIOverview(
  current: { page: string; clicks: number; impressions: number; ctr: number; position: number }[],
  previous: { page: string; impressions: number; ctr: number; position: number }[]
) {
  const prevMap = new Map(previous.map((p) => [p.page, p]));

  return current
    .filter((curr) => {
      const prev = prevMap.get(curr.page);
      if (!prev || prev.impressions < 30) return false;

      const impGrowth = (curr.impressions - prev.impressions) / prev.impressions;
      const ctrDrop = prev.ctr > 0 ? (curr.ctr - prev.ctr) / prev.ctr : 0;
      const rankImproved = curr.position < prev.position - 0.3;

      // Pattern: impressions stable/up, rank improved, CTR dropped 25%+
      return impGrowth > -0.15 && ctrDrop < -0.25 && rankImproved;
    })
    .map((curr) => {
      const prev = prevMap.get(curr.page)!;
      return {
        ...curr,
        prevCtr: prev.ctr,
        prevImpressions: prev.impressions,
        prevPosition: prev.position,
        ctrDrop: Math.round(((curr.ctr - prev.ctr) / prev.ctr) * 100),
        impChange: Math.round(((curr.impressions - prev.impressions) / prev.impressions) * 100),
      };
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);
}

// 게재순위 3~10위 Near Miss 키워드
function findNearMiss(queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]) {
  return queries
    .filter((q) => q.position > 3 && q.position <= 10 && q.impressions >= 50)
    .map((q) => {
      // 클릭 잠재력: 순위가 3위가 됐을 때 예상 클릭 (CTR ~10% 기준)
      const potentialCTR = 0.10;
      const potentialClicks = Math.round(q.impressions * potentialCTR);
      const uplift = potentialClicks - q.clicks;
      return { ...q, potentialClicks, uplift };
    })
    .sort((a, b) => b.uplift - a.uplift)
    .slice(0, 15);
}

// CTR 낮은 고노출 쿼리 (메타 최적화 기회)
function findCTROpportunities(queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]) {
  return queries
    .filter((q) => q.impressions >= 100 && q.ctr < 0.02 && q.position <= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);
}

export async function POST(req: NextRequest) {
  const { siteUrl, startDate, endDate, compareStartDate, compareEndDate } = await req.json();

  if (!siteUrl?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'siteUrl, startDate, endDate가 필요합니다.' }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const accessToken = await getValidGSCToken(session.user.email);
  if (!accessToken) return NextResponse.json({ error: 'Search Console 연결이 필요합니다.' }, { status: 401 });

  try {
    // 현재 기간: 페이지별 + 쿼리별
    const [currentPages, currentQueries, prevPages] = await Promise.all([
      querySearchAnalytics(accessToken, siteUrl, {
        startDate, endDate, dimensions: ['page'], rowLimit: 25,
      }),
      querySearchAnalytics(accessToken, siteUrl, {
        startDate, endDate, dimensions: ['query'], rowLimit: 50,
      }),
      compareStartDate && compareEndDate
        ? querySearchAnalytics(accessToken, siteUrl, {
            startDate: compareStartDate, endDate: compareEndDate, dimensions: ['page'], rowLimit: 25,
          })
        : Promise.resolve([] as GSCRow[]),
    ]);

    const pages = currentPages.map((r) => ({
      page: r.keys[0],
      clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: Math.round(r.position * 10) / 10,
    }));

    const queries = currentQueries.map((r) => ({
      query: r.keys[0],
      clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: Math.round(r.position * 10) / 10,
    }));

    const prevPagesNorm = prevPages.map((r) => ({
      page: r.keys[0],
      clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: Math.round(r.position * 10) / 10,
    }));

    // Totals
    const totals = pages.reduce(
      (acc, p) => ({ clicks: acc.clicks + p.clicks, impressions: acc.impressions + p.impressions }),
      { clicks: 0, impressions: 0 }
    );
    const avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
    const avgPosition = pages.length > 0
      ? pages.reduce((a, p) => a + p.position * p.impressions, 0) / Math.max(pages.reduce((a, p) => a + p.impressions, 0), 1)
      : 0;

    // Comparison totals
    let compTotals = null;
    if (prevPagesNorm.length > 0) {
      const ct = prevPagesNorm.reduce(
        (acc, p) => ({ clicks: acc.clicks + p.clicks, impressions: acc.impressions + p.impressions }),
        { clicks: 0, impressions: 0 }
      );
      const cAvgCtr = ct.impressions > 0 ? ct.clicks / ct.impressions : 0;
      const cAvgPos = prevPagesNorm.length > 0
        ? prevPagesNorm.reduce((a, p) => a + p.position * p.impressions, 0) / Math.max(prevPagesNorm.reduce((a, p) => a + p.impressions, 0), 1)
        : 0;
      compTotals = { ...ct, avgCtr: cAvgCtr, avgPosition: Math.round(cAvgPos * 10) / 10 };
    }

    return NextResponse.json({
      period: { startDate, endDate },
      comparePeriod: compareStartDate ? { startDate: compareStartDate, endDate: compareEndDate } : null,
      totals: { ...totals, avgCtr, avgPosition: Math.round(avgPosition * 10) / 10 },
      compTotals,
      pages,
      queries,
      aiOverviewCandidates: prevPagesNorm.length > 0 ? detectAIOverview(pages, prevPagesNorm) : [],
      nearMissQueries: findNearMiss(queries),
      ctrOpportunities: findCTROpportunities(queries),
    });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[GSC data]', msg);
    if (msg.includes('403')) return NextResponse.json({ error: '접근 권한 없음: 해당 사이트의 Search Console 권한을 확인하세요.' }, { status: 403 });
    return NextResponse.json({ error: 'GSC 오류: ' + msg }, { status: 500 });
  }
}
