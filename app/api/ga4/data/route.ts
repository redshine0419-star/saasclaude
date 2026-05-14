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
    const [trendRes, channelRes, pagesRes, deviceRes] = await Promise.all([
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: ['sessions', 'activeUsers', 'newUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate'].map((name) => ({ name })),
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics: ['sessions', 'activeUsers', 'conversions'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: ['screenPageViews', 'averageSessionDuration', 'bounceRate', 'activeUsers'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: ['sessions', 'activeUsers'].map((name) => ({ name })),
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    ]);

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

    const topPages = parseRows(pagesRes).map((r) => ({
      path: r.dimensions[0], title: r.dimensions[1], pageViews: parseInt(r.metrics[0]),
      avgDuration: parseFloat(r.metrics[1]), bounceRate: parseFloat(r.metrics[2]), activeUsers: parseInt(r.metrics[3]),
    }));

    const devices = parseRows(deviceRes).map((r) => ({
      device: r.dimensions[0], sessions: parseInt(r.metrics[0]), activeUsers: parseInt(r.metrics[1]),
    }));

    return NextResponse.json({
      totals: { ...totals, avgBounceRate: Math.round(avgBounceRate * 100), avgSessionDuration: Math.round(avgSessionDuration) },
      trend, channels, topPages, devices,
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
