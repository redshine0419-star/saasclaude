import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function POST(req: NextRequest) {
  const { propertyId, serviceAccountKey } = await req.json();

  if (!propertyId?.trim() || !serviceAccountKey?.trim()) {
    return NextResponse.json({ error: 'Property ID와 서비스 계정 키가 필요합니다.' }, { status: 400 });
  }

  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(serviceAccountKey);
    if (!credentials.private_key || !credentials.client_email) {
      throw new Error('invalid');
    }
  } catch {
    return NextResponse.json({ error: '서비스 계정 JSON 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const cleanPropertyId = propertyId.replace(/^properties\//, '');
  const property = 'properties/' + cleanPropertyId;

  try {
    const client = new BetaAnalyticsDataClient({ credentials });

    const [trendRes, channelRes, pagesRes, deviceRes] = await Promise.all([
      // 최근 30일 일별 트렌드
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      // 채널별 트래픽
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'conversions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      // 상위 10개 페이지
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'activeUsers' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      // 기기별 분포
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    ]);

    const parseRows = (res: typeof trendRes[0]) =>
      (res.rows ?? []).map((row) => ({
        dimensions: (row.dimensionValues ?? []).map((d) => d.value ?? ''),
        metrics: (row.metricValues ?? []).map((m) => m.value ?? '0'),
      }));

    const trend = parseRows(trendRes[0]).map((r) => ({
      date: r.dimensions[0],
      sessions: parseInt(r.metrics[0]),
      activeUsers: parseInt(r.metrics[1]),
      newUsers: parseInt(r.metrics[2]),
      pageViews: parseInt(r.metrics[3]),
      avgSessionDuration: parseFloat(r.metrics[4]),
      bounceRate: parseFloat(r.metrics[5]),
    }));

    const totals = trend.reduce(
      (acc, d) => ({
        sessions: acc.sessions + d.sessions,
        activeUsers: acc.activeUsers + d.activeUsers,
        newUsers: acc.newUsers + d.newUsers,
        pageViews: acc.pageViews + d.pageViews,
      }),
      { sessions: 0, activeUsers: 0, newUsers: 0, pageViews: 0 }
    );
    const avgBounceRate = trend.length > 0
      ? trend.reduce((a, d) => a + d.bounceRate, 0) / trend.length
      : 0;
    const avgSessionDuration = trend.length > 0
      ? trend.reduce((a, d) => a + d.avgSessionDuration, 0) / trend.length
      : 0;

    const channels = parseRows(channelRes[0]).map((r) => ({
      channel: r.dimensions[0],
      sessions: parseInt(r.metrics[0]),
      activeUsers: parseInt(r.metrics[1]),
      conversions: parseInt(r.metrics[2]),
    }));

    const topPages = parseRows(pagesRes[0]).map((r) => ({
      path: r.dimensions[0],
      title: r.dimensions[1],
      pageViews: parseInt(r.metrics[0]),
      avgDuration: parseFloat(r.metrics[1]),
      bounceRate: parseFloat(r.metrics[2]),
      activeUsers: parseInt(r.metrics[3]),
    }));

    const devices = parseRows(deviceRes[0]).map((r) => ({
      device: r.dimensions[0],
      sessions: parseInt(r.metrics[0]),
      activeUsers: parseInt(r.metrics[1]),
    }));

    return NextResponse.json({
      totals: { ...totals, avgBounceRate: Math.round(avgBounceRate * 100), avgSessionDuration: Math.round(avgSessionDuration) },
      trend,
      channels,
      topPages,
      devices,
    });
  } catch (e) {
    const err = e as any;
    const msg = err?.message || err?.details || (err?.code !== undefined ? 'gRPC code ' + err.code : '알 수 없는 오류');
    console.error('[GA4 data]', err);
    if (msg.includes('PERMISSION_DENIED') || err?.code === 7) {
      return NextResponse.json({ error: '접근 권한 없음: 서비스 계정에 GA4 속성 뷰어 권한을 부여하세요.' }, { status: 403 });
    }
    if (msg.includes('NOT_FOUND') || err?.code === 5) {
      return NextResponse.json({ error: 'Property를 찾을 수 없습니다. Property ID(' + cleanPropertyId + ')를 확인하세요.' }, { status: 404 });
    }
    if (msg.includes('UNAUTHENTICATED') || err?.code === 16) {
      return NextResponse.json({ error: '인증 실패: 서비스 계정 JSON 키가 유효하지 않습니다.' }, { status: 401 });
    }
    if (msg.includes('invalid_grant') || msg.includes('private key')) {
      return NextResponse.json({ error: '서비스 계정 키 오류: private_key가 올바르지 않습니다.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'GA4 오류: ' + msg }, { status: 500 });
  }
}
