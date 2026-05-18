import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidAccessToken } from '@/lib/ga4-tokens';

async function runReport(accessToken: string, property: string, body: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${property}:runReport`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `GA4 API 오류 (${res.status})`);
  return data;
}

function parseRows(response: { rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[] }) {
  return (response.rows ?? []).map((row) => ({
    dimensions: (row.dimensionValues ?? []).map((d) => d.value ?? ''),
    metrics: (row.metricValues ?? []).map((m) => m.value ?? '0'),
  }));
}

export async function POST(req: NextRequest) {
  const { propertyId } = await req.json();

  if (!propertyId?.trim()) {
    return NextResponse.json({ error: 'Property ID가 필요합니다.' }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const accessToken = await getValidAccessToken(session.user.email);
  if (!accessToken) {
    return NextResponse.json({ error: 'GA4 연결이 필요합니다. GA4 Analytics 탭에서 Google 계정을 연결해주세요.' }, { status: 401 });
  }

  const cleanPropertyId = propertyId.replace(/^properties\//, '');
  const property = 'properties/' + cleanPropertyId;

  try {
    const [
      trendRes,
      channelRes,
      sourceMediumRes,
      pagesRes,
      landingPageRes,
      deviceRes,
      prevTotalsRes,
      prevChannelRes,
    ] = await Promise.all([
      // Daily trend — current 30 days
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: ['sessions', 'activeUsers', 'newUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate'].map((name) => ({ name })),
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      // Channel group (kept for color-coding & backward compat)
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics: ['sessions', 'activeUsers', 'conversions'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      // Source / Medium breakdown
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: ['sessions', 'activeUsers', 'bounceRate', 'conversions', 'averageSessionDuration'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }),
      // Top pages by pageview
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: ['screenPageViews', 'averageSessionDuration', 'bounceRate', 'activeUsers'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      // Landing pages — entry point bounce & conversion
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'landingPage' }],
        metrics: ['sessions', 'bounceRate', 'conversions', 'activeUsers'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),
      // Device category
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: ['sessions', 'activeUsers'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      // Previous 30 days totals for comparison
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '60daysAgo', endDate: '31daysAgo' }],
        metrics: ['sessions', 'activeUsers', 'newUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate'].map((name) => ({ name })),
      }),
      // Previous 30 days source/medium
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '60daysAgo', endDate: '31daysAgo' }],
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: ['sessions', 'conversions'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }),
    ]);

    // ── Current period ──────────────────────────────────────────────────
    const trend = parseRows(trendRes).map((r) => ({
      date: r.dimensions[0],
      sessions: parseInt(r.metrics[0]),
      activeUsers: parseInt(r.metrics[1]),
      newUsers: parseInt(r.metrics[2]),
      pageViews: parseInt(r.metrics[3]),
      avgSessionDuration: parseFloat(r.metrics[4]),
      bounceRate: parseFloat(r.metrics[5]),
    }));

    const totals = trend.reduce(
      (acc, d) => ({ sessions: acc.sessions + d.sessions, activeUsers: acc.activeUsers + d.activeUsers, newUsers: acc.newUsers + d.newUsers, pageViews: acc.pageViews + d.pageViews }),
      { sessions: 0, activeUsers: 0, newUsers: 0, pageViews: 0 }
    );
    const avgBounceRate = trend.length > 0 ? trend.reduce((a, d) => a + d.bounceRate, 0) / trend.length : 0;
    const avgSessionDuration = trend.length > 0 ? trend.reduce((a, d) => a + d.avgSessionDuration, 0) / trend.length : 0;

    const channels = parseRows(channelRes).map((r) => ({
      channel: r.dimensions[0], sessions: parseInt(r.metrics[0]), activeUsers: parseInt(r.metrics[1]), conversions: parseInt(r.metrics[2]),
    }));

    const sourceMediums = parseRows(sourceMediumRes).map((r) => ({
      sourceMedium: r.dimensions[0],
      sessions: parseInt(r.metrics[0]),
      activeUsers: parseInt(r.metrics[1]),
      bounceRate: Math.round(parseFloat(r.metrics[2]) * 100),
      conversions: parseInt(r.metrics[3]),
      avgSessionDuration: Math.round(parseFloat(r.metrics[4])),
    }));

    const topPages = parseRows(pagesRes).map((r) => ({
      path: r.dimensions[0], title: r.dimensions[1], pageViews: parseInt(r.metrics[0]),
      avgDuration: parseFloat(r.metrics[1]), bounceRate: parseFloat(r.metrics[2]), activeUsers: parseInt(r.metrics[3]),
    }));

    const landingPages = parseRows(landingPageRes).map((r) => ({
      path: r.dimensions[0],
      sessions: parseInt(r.metrics[0]),
      bounceRate: Math.round(parseFloat(r.metrics[1]) * 100),
      conversions: parseInt(r.metrics[2]),
      activeUsers: parseInt(r.metrics[3]),
    }));

    const devices = parseRows(deviceRes).map((r) => ({
      device: r.dimensions[0], sessions: parseInt(r.metrics[0]), activeUsers: parseInt(r.metrics[1]),
    }));

    // ── Previous period ─────────────────────────────────────────────────
    const prevRow = prevTotalsRes.rows?.[0];
    const prevTotals = prevRow ? {
      sessions: parseInt(prevRow.metricValues?.[0]?.value ?? '0'),
      activeUsers: parseInt(prevRow.metricValues?.[1]?.value ?? '0'),
      newUsers: parseInt(prevRow.metricValues?.[2]?.value ?? '0'),
      pageViews: parseInt(prevRow.metricValues?.[3]?.value ?? '0'),
      avgSessionDuration: Math.round(parseFloat(prevRow.metricValues?.[4]?.value ?? '0')),
      avgBounceRate: Math.round(parseFloat(prevRow.metricValues?.[5]?.value ?? '0') * 100),
    } : null;

    const prevSourceMediums = parseRows(prevChannelRes).map((r) => ({
      sourceMedium: r.dimensions[0],
      sessions: parseInt(r.metrics[0]),
      conversions: parseInt(r.metrics[1]),
    }));

    return NextResponse.json({
      totals: { ...totals, avgBounceRate: Math.round(avgBounceRate * 100), avgSessionDuration: Math.round(avgSessionDuration) },
      prevTotals,
      trend,
      channels,
      sourceMediums,
      prevSourceMediums,
      topPages,
      landingPages,
      devices,
    });
  } catch (e) {
    const msg = (e as Error).message || '알 수 없는 오류';
    console.error('[GA4 data]', msg);
    if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
      return NextResponse.json({ error: '접근 권한 없음: 연결된 Google 계정에 해당 GA4 속성의 뷰어 권한이 없습니다.' }, { status: 403 });
    }
    if (msg.includes('NOT_FOUND') || msg.includes('404')) {
      return NextResponse.json({ error: `Property를 찾을 수 없습니다. ID(${cleanPropertyId})를 확인하세요.` }, { status: 404 });
    }
    if (msg.includes('UNAUTHENTICATED') || msg.includes('401') || msg.includes('invalid_grant')) {
      return NextResponse.json({ error: '인증 만료: GA4 탭에서 다시 연결해주세요.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'GA4 오류: ' + msg }, { status: 500 });
  }
}
