import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

function extractJson(text: string): string {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('JSON not found');
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  throw new Error('Unbalanced JSON');
}

function pctDelta(curr: number, prev: number): string {
  if (!prev) return '전기 없음';
  const d = Math.round(((curr - prev) / prev) * 100);
  return d > 0 ? `+${d}%` : `${d}%`;
}

function ppDelta(curr: number, prev: number): string {
  const d = curr - prev;
  return d > 0 ? `+${d}pp` : `${d}pp`;
}

export async function POST(req: NextRequest) {
  const { data, siteUrl, gscData, condition } = await req.json();
  if (!data) return NextResponse.json({ error: '분석할 데이터가 없습니다.' }, { status: 400 });

  const { totals, prevTotals, channels, sourceMediums, prevSourceMediums, topPages, landingPages, devices, trend } = data;

  // ── Week-by-week trend ─────────────────────────────────────────────────
  const weeks = [0, 1, 2, 3].map((w) => {
    const slice = (trend ?? []).slice(w * 7, (w + 1) * 7);
    if (!slice.length) return null;
    const sessions = slice.reduce((a: number, d: { sessions: number }) => a + d.sessions, 0);
    const bounceRate = slice.reduce((a: number, d: { bounceRate: number }) => a + d.bounceRate, 0) / slice.length;
    return { week: w + 1, sessions, avgBounce: Math.round(bounceRate * 100) };
  }).filter(Boolean) as { week: number; sessions: number; avgBounce: number }[];

  const weeklyStr = weeks.map((w) => `${w.week}주차: ${w.sessions}세션, 이탈률 ${w.avgBounce}%`).join(' → ');

  // ── Period comparison ──────────────────────────────────────────────────
  let comparisonSection = '(전월 비교 데이터 없음)';
  if (prevTotals) {
    comparisonSection = `[전월(직전 30일) 대비 변화]
- 세션: ${totals.sessions} vs ${prevTotals.sessions} → ${pctDelta(totals.sessions, prevTotals.sessions)}
- 활성 사용자: ${totals.activeUsers} vs ${prevTotals.activeUsers} → ${pctDelta(totals.activeUsers, prevTotals.activeUsers)}
- 신규 사용자: ${totals.newUsers} vs ${prevTotals.newUsers} → ${pctDelta(totals.newUsers, prevTotals.newUsers)}
- 페이지뷰: ${totals.pageViews} vs ${prevTotals.pageViews} → ${pctDelta(totals.pageViews, prevTotals.pageViews)}
- 이탈률: ${totals.avgBounceRate}% vs ${prevTotals.avgBounceRate}% → ${ppDelta(totals.avgBounceRate, prevTotals.avgBounceRate)}
- 평균 세션 시간: ${Math.floor(totals.avgSessionDuration / 60)}분${totals.avgSessionDuration % 60}초 vs ${Math.floor(prevTotals.avgSessionDuration / 60)}분${prevTotals.avgSessionDuration % 60}초 → ${pctDelta(totals.avgSessionDuration, prevTotals.avgSessionDuration)}`;
  }

  // ── Source/Medium ──────────────────────────────────────────────────────
  const totalSessions = totals.sessions || 1;
  const prevSmMap = new Map((prevSourceMediums ?? []).map((s: { sourceMedium: string; sessions: number; conversions: number }) => [s.sourceMedium, s]));

  const sourceMediumStr = (sourceMediums ?? []).slice(0, 15).map((s: {
    sourceMedium: string; sessions: number; bounceRate: number; conversions: number; avgSessionDuration: number;
  }) => {
    const pct = Math.round((s.sessions / totalSessions) * 100);
    const prev = prevSmMap.get(s.sourceMedium) as { sessions: number; conversions: number } | undefined;
    const sessionDelta = prev ? ` (전월 ${pctDelta(s.sessions, prev.sessions)})` : ' (신규 채널)';
    return `${s.sourceMedium}: ${s.sessions}세션(${pct}%), 이탈률 ${s.bounceRate}%, 전환 ${s.conversions}회, 체류 ${Math.floor(s.avgSessionDuration / 60)}분${s.avgSessionDuration % 60}초${sessionDelta}`;
  }).join('\n');

  // ── Landing pages ──────────────────────────────────────────────────────
  const landingStr = (landingPages ?? []).slice(0, 8).map((p: {
    path: string; sessions: number; bounceRate: number; conversions: number;
  }) => {
    const convRate = p.sessions > 0 ? ((p.conversions / p.sessions) * 100).toFixed(1) : '0.0';
    return `${p.path}: 진입 ${p.sessions}세션, 이탈률 ${p.bounceRate}%, 전환율 ${convRate}%`;
  }).join('\n');

  // ── Top pages ──────────────────────────────────────────────────────────
  const topPagesStr = (topPages ?? []).slice(0, 8).map((p: {
    path: string; pageViews: number; bounceRate: number; avgDuration: number;
  }) => `${p.path}: PV ${p.pageViews}, 이탈률 ${Math.round(p.bounceRate * 100)}%, 체류 ${Math.round(p.avgDuration)}초`).join('\n');

  const deviceStr = (devices ?? []).map((d: { device: string; sessions: number }) =>
    `${d.device}: ${d.sessions}세션(${Math.round((d.sessions / totalSessions) * 100)}%)`
  ).join(', ');

  const returningUsers = Math.max(0, (totals?.activeUsers ?? 0) - (totals?.newUsers ?? 0));
  const newRatio = totals?.activeUsers > 0 ? Math.round((totals.newUsers / totals.activeUsers) * 100) : 0;
  const sessionDuration = totals?.avgSessionDuration ?? 0;

  // ── GSC context ────────────────────────────────────────────────────────
  let gscSection = '';
  if (gscData && !gscData.error) {
    const { totals: gt, nearMissQueries, aiOverviewCandidates, ctrOpportunities } = gscData;
    gscSection = `
[Search Console 데이터]
- 클릭수: ${gt?.clicks ?? 0} / 노출수: ${gt?.impressions ?? 0} / CTR: ${((gt?.avgCtr ?? 0) * 100).toFixed(1)}% / 평균 순위: ${gt?.avgPosition ?? '-'}위
${aiOverviewCandidates?.length > 0 ? `- AI Overview 피해 의심: ${aiOverviewCandidates.length}개 페이지 (노출 유지·CTR 25%↓)` : ''}
${nearMissQueries?.length > 0 ? `- 순위 3~10위 Near Miss: ${nearMissQueries.length}개 키워드` : ''}
${ctrOpportunities?.length > 0 ? `- CTR 최적화 기회: ${ctrOpportunities.length}개 (노출 많음·CTR 2% 미만)` : ''}`;
  }

  // ── unused variable suppression ────────────────────────────────────────
  void channels;

  const conditionBlock = condition
    ? `\n[분석 조건 — 반드시 이 조건을 최우선으로 반영하세요]\n${condition}\n`
    : '';

  const prompt = `아래 GA4 데이터를 분석하여 이탈률 개선, 유입 확대, 전환율 개선을 위한 실행 가능한 인사이트를 도출하세요.${conditionBlock}

[분석 사이트]
${siteUrl || '(미입력)'}

[현재 30일 핵심 지표]
- 세션: ${totals?.sessions ?? 0} (일평균 ${Math.round((totals?.sessions ?? 0) / 30)})
- 활성 사용자: ${totals?.activeUsers ?? 0} (신규 ${totals?.newUsers ?? 0} / 재방문 ${returningUsers}, 신규비율 ${newRatio}%)
- 페이지뷰: ${totals?.pageViews ?? 0}
- 평균 이탈률: ${totals?.avgBounceRate ?? 0}%
- 평균 세션 시간: ${Math.floor(sessionDuration / 60)}분 ${sessionDuration % 60}초
- 기기 비중: ${deviceStr}

[주차별 추이]
${weeklyStr || '데이터 없음'}

${comparisonSection}

[세션 소스/매체 분석 (현재 30일 vs 전월)]
${sourceMediumStr || '데이터 없음'}

[랜딩 페이지 이탈·전환 분석]
${landingStr || '데이터 없음'}

[상위 콘텐츠 페이지]
${topPagesStr || '데이터 없음'}
${gscSection}

---

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 없이 순수 JSON만 출력하세요.
모든 항목은 반드시 구체적인 수치와 소스/매체명을 포함해야 합니다.

{
  "healthScore": 0~100 정수 (종합 마케팅 건강도),
  "executiveSummary": "30초 요약. 전월 대비 핵심 변화와 가장 시급한 이슈 2~3문장",
  "keyFindings": [
    "핵심 발견 1 — 소스/매체명과 수치 포함",
    "핵심 발견 2 — 전월 대비 변화 포함",
    "핵심 발견 3 — 이탈/전환 관련 수치",
    "핵심 발견 4 — 유입 채널 집중도 관련"
  ],
  "trendDirection": "growing 또는 declining 또는 stable",
  "trendNarrative": "주차별 추이와 전월 비교를 바탕으로 한 트렌드 해석 2문장",
  "acquisitionInsight": "소스/매체별 유입 분석. 성장 채널·감소 채널·전월 대비 변화를 구체적 수치로 2~3문장",
  "bounceInsight": "이탈률이 높은 소스/매체·랜딩페이지와 원인 분석. 개선 우선순위 2문장",
  "conversionInsight": "전환율이 높은 채널과 낮은 채널 비교. 전환 개선 기회 2문장",
  "channelInsight": "채널 의존도 리스크와 다각화 필요성 1~2문장",
  "audienceInsight": "신규/재방문 비율·체류시간·기기 비중으로 파악한 오디언스 특성 2문장",
  "risks": [
    { "title": "위험 제목", "severity": "high", "detail": "수치 포함 설명", "action": "즉각 액션" },
    { "title": "위험 제목", "severity": "medium", "detail": "수치 포함 설명", "action": "즉각 액션" },
    { "title": "위험 제목", "severity": "low", "detail": "수치 포함 설명", "action": "즉각 액션" }
  ],
  "strengths": [
    { "title": "강점 제목", "detail": "수치 기반 설명" },
    { "title": "강점 제목", "detail": "수치 기반 설명" }
  ],
  "quickWins": [
    { "category": "이탈 개선 또는 유입 확대 또는 전환 개선", "action": "이번 주 실행 액션 (구체적)", "detail": "실행 방법", "kpi": "예상 개선 수치", "effort": "낮음 또는 보통" },
    { "category": "이탈 개선 또는 유입 확대 또는 전환 개선", "action": "이번 주 실행 액션", "detail": "실행 방법", "kpi": "예상 개선 수치", "effort": "낮음 또는 보통" },
    { "category": "이탈 개선 또는 유입 확대 또는 전환 개선", "action": "이번 주 실행 액션", "detail": "실행 방법", "kpi": "예상 개선 수치", "effort": "낮음 또는 보통" }
  ],
  "monthlyGoals": [
    { "category": "이탈 개선", "goal": "목표 (수치 포함)", "strategy": "전략 2~3단계", "kpi": "측정 지표와 목표치" },
    { "category": "유입 확대", "goal": "목표 (수치 포함)", "strategy": "전략 2~3단계", "kpi": "측정 지표와 목표치" },
    { "category": "전환 개선", "goal": "목표 (수치 포함)", "strategy": "전략 2~3단계", "kpi": "측정 지표와 목표치" }
  ],
  "quarterlyVision": "3개월 후 이탈·유입·전환 목표치와 핵심 실행 방향 2문장"
}`;

  try {
    const { text: rawText } = await generateText(prompt);
    const jsonStr = extractJson(rawText.trim());
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (e) {
    console.error('[GA4 analyze]', e);
    return NextResponse.json({ error: 'AI 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
