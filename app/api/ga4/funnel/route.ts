import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidAccessToken } from '@/lib/ga4-tokens';
import { generateText } from '@/lib/ai';

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
  if (!res.ok) throw new Error(data?.error?.message ?? `GA4 API 오류 (${res.status})`);
  return data;
}

function parseRows(response: {
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
}) {
  return (response.rows ?? []).map((row) => ({
    dimensions: (row.dimensionValues ?? []).map((d) => d.value ?? ''),
    metrics: (row.metricValues ?? []).map((m) => m.value ?? '0'),
  }));
}

export interface FunnelPageItem {
  path: string;
  sessions: number;
  engagedSessions: number;
  avgSessionDuration: number;
  pagesPerSession: number;
  conversions: number;
  bounceRate: number;
  engagementRate: number;
  conversionRate: number;
  health: 'good' | 'warning' | 'critical';
  primaryDropStage: 'entry' | 'engagement' | 'conversion' | null;
  aiAction: string;
}

export interface FunnelStage {
  stage: string;
  label: string;
  value: number;
  pct: number;
  dropPct: number;
}

export async function POST(req: NextRequest) {
  const { propertyId } = await req.json();

  if (!propertyId?.trim()) {
    return NextResponse.json({ error: 'Property ID가 필요합니다.' }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const accessToken = await getValidAccessToken(session.user.email);
  if (!accessToken) return NextResponse.json({ error: 'GA4 연결이 필요합니다.' }, { status: 401 });

  const property = 'properties/' + propertyId.replace(/^properties\//, '');

  try {
    const [overallRes, landingRes] = await Promise.all([
      // 전체 퍼널 집계
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
          { name: 'conversions' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'screenPageViewsPerSession' },
        ],
      }),
      // 랜딩 페이지별 퍼널
      runReport(accessToken, property, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'landingPage' }],
        metrics: [
          { name: 'sessions' },
          { name: 'engagedSessions' },
          { name: 'conversions' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'screenPageViewsPerSession' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 12,
      }),
    ]);

    // ── 전체 퍼널 집계 ──────────────────────────────────────────────────────
    const ov = overallRes.rows?.[0];
    const totalSessions = parseInt(ov?.metricValues?.[0]?.value ?? '0');
    const totalEngaged = parseInt(ov?.metricValues?.[1]?.value ?? '0');
    const totalConversions = parseInt(ov?.metricValues?.[2]?.value ?? '0');
    const avgDuration = parseFloat(ov?.metricValues?.[3]?.value ?? '0');
    const avgBounce = parseFloat(ov?.metricValues?.[4]?.value ?? '0');
    const avgPPS = parseFloat(ov?.metricValues?.[5]?.value ?? '0');

    // 퍼널 단계 정의
    const funnelStages: FunnelStage[] = (() => {
      const stages = [
        { stage: 'sessions', label: '방문 세션', value: totalSessions },
        { stage: 'engaged', label: '이탈 없이 참여', value: totalEngaged },
        { stage: 'deep', label: '60초+ 체류', value: Math.round(totalEngaged * Math.min((avgDuration / 120), 0.9)) },
        { stage: 'conversion', label: '전환 완료', value: totalConversions },
      ];
      return stages.map((s, i) => {
        const prev = i === 0 ? s.value : stages[i - 1].value;
        const pct = totalSessions > 0 ? Math.round((s.value / totalSessions) * 100) : 0;
        const dropPct = prev > 0 ? Math.round(((prev - s.value) / prev) * 100) : 0;
        return { ...s, pct, dropPct: i === 0 ? 0 : dropPct };
      });
    })();

    // ── 페이지별 분석 ────────────────────────────────────────────────────────
    const landingRows = parseRows(landingRes);
    const avgConvRate = totalSessions > 0 ? totalConversions / totalSessions : 0;
    const avgBounceNum = avgBounce;

    const pages: Omit<FunnelPageItem, 'aiAction'>[] = landingRows.map((r) => {
      const sessions = parseInt(r.metrics[0]);
      const engagedSessions = parseInt(r.metrics[1]);
      const conversions = parseInt(r.metrics[2]);
      const duration = parseFloat(r.metrics[3]);
      const bounce = parseFloat(r.metrics[4]);
      const pps = parseFloat(r.metrics[5]);
      const engRate = sessions > 0 ? engagedSessions / sessions : 0;
      const convRate = sessions > 0 ? conversions / sessions : 0;

      let health: 'good' | 'warning' | 'critical' = 'good';
      let primaryDropStage: FunnelPageItem['primaryDropStage'] = null;

      if (bounce > avgBounceNum * 1.4 && sessions >= 20) {
        health = 'critical';
        primaryDropStage = 'entry';
      } else if (convRate < avgConvRate * 0.5 && engRate > 0.4 && sessions >= 20) {
        health = 'warning';
        primaryDropStage = 'conversion';
      } else if (engRate < 0.4 && sessions >= 20) {
        health = 'warning';
        primaryDropStage = 'engagement';
      }

      if (bounce > avgBounceNum * 1.6) health = 'critical';

      return {
        path: r.dimensions[0],
        sessions,
        engagedSessions,
        avgSessionDuration: Math.round(duration),
        pagesPerSession: Math.round(pps * 10) / 10,
        conversions,
        bounceRate: Math.round(bounce * 100),
        engagementRate: Math.round(engRate * 100),
        conversionRate: Math.round(convRate * 1000) / 10,
        health,
        primaryDropStage,
      };
    }).filter((p) => p.sessions >= 5);

    // ── AI 진단 ──────────────────────────────────────────────────────────────
    const problemPages = pages.filter((p) => p.health !== 'good').slice(0, 6);

    let aiActions: Record<string, string> = {};
    if (problemPages.length > 0) {
      const prompt = `당신은 전환율 최적화(CRO) 전문가입니다. 아래 랜딩 페이지 퍼널 데이터를 분석하여, 각 페이지에 대해 즉시 실행 가능한 개선 액션을 한국어 1~2문장으로 작성하세요.

사이트 평균: 이탈률 ${Math.round(avgBounceNum * 100)}%, 전환율 ${Math.round(avgConvRate * 1000) / 10}%, 평균 체류 ${Math.round(avgDuration)}초

문제 페이지:
${problemPages.map((p, i) => `${i + 1}. "${p.path}" — 이탈률 ${p.bounceRate}%, 참여율 ${p.engagementRate}%, 전환율 ${p.conversionRate}%, 체류 ${p.avgSessionDuration}초, 주요 이탈 단계: ${p.primaryDropStage === 'entry' ? '첫 화면 이탈' : p.primaryDropStage === 'engagement' ? '참여 미흡' : '전환 미흡'}`).join('\n')}

응답 형식 (JSON, 다른 텍스트 없이):
{"path1": "액션 설명", "path2": "액션 설명", ...}`;

      try {
        const { text } = await generateText(prompt);
        const match = text.match(/\{[\s\S]*\}/);
        if (match) aiActions = JSON.parse(match[0]) as Record<string, string>;
      } catch { /* fallback 사용 */ }
    }

    const pagesWithActions: FunnelPageItem[] = pages.map((p) => ({
      ...p,
      aiAction: aiActions[p.path] ?? (
        p.primaryDropStage === 'entry'
          ? '첫 화면에 핵심 가치 문구와 CTA 버튼을 배치하고, 로딩 속도를 개선하세요.'
          : p.primaryDropStage === 'conversion'
          ? '페이지 내 CTA 버튼을 눈에 잘 띄는 위치로 이동하고, 신뢰 지표(리뷰·보증)를 추가하세요.'
          : p.primaryDropStage === 'engagement'
          ? '스크롤 유도 콘텐츠를 첫 화면 하단에 추가하고, 내부 링크를 3개 이상 배치하세요.'
          : ''
      ),
    }));

    return NextResponse.json({
      overall: {
        totalSessions,
        totalEngaged,
        totalConversions,
        avgSessionDuration: Math.round(avgDuration),
        avgBounceRate: Math.round(avgBounceNum * 100),
        avgPagesPerSession: Math.round(avgPPS * 10) / 10,
        overallConvRate: Math.round(avgConvRate * 1000) / 10,
      },
      funnelStages,
      pages: pagesWithActions,
    });
  } catch (e) {
    const msg = (e as Error).message ?? '알 수 없는 오류';
    console.error('[GA4 funnel]', msg);
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      return NextResponse.json({ error: '접근 권한 없음: GA4 속성 뷰어 권한을 확인하세요.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'GA4 퍼널 오류: ' + msg }, { status: 500 });
  }
}
