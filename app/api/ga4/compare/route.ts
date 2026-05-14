import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidAccessToken } from '@/lib/ga4-tokens';

interface Period {
  start: string;
  end: string;
  label: string;
}

async function runReport(accessToken: string, property: string, body: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${property}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `GA4 API 오류 (${res.status})`);
  return data;
}

function parseRows(res: { rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[] }) {
  return (res.rows ?? []).map((row) => ({
    dimensions: (row.dimensionValues ?? []).map((d) => d.value ?? ''),
    metrics: (row.metricValues ?? []).map((m) => m.value ?? '0'),
  }));
}

async function fetchPeriodData(accessToken: string, property: string, period: Period) {
  const dateRanges = [{ startDate: period.start, endDate: period.end }];

  const [totalsRes, channelsRes, topPagesRes] = await Promise.all([
    runReport(accessToken, property, {
      dateRanges,
      metrics: ['sessions', 'activeUsers', 'newUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate'].map((name) => ({ name })),
    }),
    runReport(accessToken, property, {
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
      metrics: ['sessions'].map((name) => ({ name })),
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 6,
    }),
    runReport(accessToken, property, {
      dateRanges,
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: ['screenPageViews', 'averageSessionDuration', 'bounceRate', 'activeUsers'].map((name) => ({ name })),
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
  ]);

  const tr = totalsRes.rows?.[0];
  const totals = {
    sessions: parseInt(tr?.metricValues?.[0]?.value ?? '0'),
    activeUsers: parseInt(tr?.metricValues?.[1]?.value ?? '0'),
    newUsers: parseInt(tr?.metricValues?.[2]?.value ?? '0'),
    pageViews: parseInt(tr?.metricValues?.[3]?.value ?? '0'),
    avgSessionDuration: Math.round(parseFloat(tr?.metricValues?.[4]?.value ?? '0')),
    avgBounceRate: Math.round(parseFloat(tr?.metricValues?.[5]?.value ?? '0') * 100),
  };

  const channels = parseRows(channelsRes).map((r) => ({
    channel: r.dimensions[0],
    sessions: parseInt(r.metrics[0]),
  }));

  const topPages = parseRows(topPagesRes).map((r) => ({
    path: r.dimensions[0],
    title: r.dimensions[1],
    pageViews: parseInt(r.metrics[0]),
    avgDuration: parseFloat(r.metrics[1]),
    bounceRate: parseFloat(r.metrics[2]),
    activeUsers: parseInt(r.metrics[3]),
  }));

  return { label: period.label, startDate: period.start, endDate: period.end, totals, channels, topPages };
}

function pctDelta(base: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((base - prev) / prev) * 100);
}

export async function POST(req: NextRequest) {
  const { propertyId, periods } = (await req.json()) as { propertyId: string; periods: Period[] };

  if (!propertyId?.trim() || !Array.isArray(periods) || periods.length < 2) {
    return NextResponse.json({ error: '속성 ID와 비교 기간(최소 2개)이 필요합니다.' }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const accessToken = await getValidAccessToken(session.user.email);
  if (!accessToken) return NextResponse.json({ error: 'GA4 연결이 필요합니다.' }, { status: 401 });

  const property = 'properties/' + propertyId.replace(/^properties\//, '');

  try {
    const periodData = await Promise.all(periods.map((p) => fetchPeriodData(accessToken, property, p)));

    const base = periodData[0].totals;
    const deltas = periodData.slice(1).map((p) => ({
      label: p.label,
      sessions: pctDelta(base.sessions, p.totals.sessions),
      activeUsers: pctDelta(base.activeUsers, p.totals.activeUsers),
      newUsers: pctDelta(base.newUsers, p.totals.newUsers),
      pageViews: pctDelta(base.pageViews, p.totals.pageViews),
      avgBounceRate: base.avgBounceRate - p.totals.avgBounceRate, // pp difference
      avgSessionDuration: pctDelta(base.avgSessionDuration, p.totals.avgSessionDuration),
    }));

    return NextResponse.json({ periods: periodData, deltas });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[GA4 compare]', msg);
    return NextResponse.json({ error: 'GA4 비교 오류: ' + msg }, { status: 500 });
  }
}
