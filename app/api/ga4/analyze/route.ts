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

export async function POST(req: NextRequest) {
  const { data, siteUrl } = await req.json();
  if (!data) return NextResponse.json({ error: '분석할 데이터가 없습니다.' }, { status: 400 });

  const { totals, channels, topPages, devices, trend } = data;

  // ── Week-by-week breakdown ──────────────────────────────────────────────
  const weeks = [0, 1, 2, 3].map((w) => {
    const slice = (trend ?? []).slice(w * 7, (w + 1) * 7);
    if (!slice.length) return null;
    const sessions = slice.reduce((a: number, d: { sessions: number }) => a + d.sessions, 0);
    const bounceRate = slice.reduce((a: number, d: { bounceRate: number }) => a + d.bounceRate, 0) / slice.length;
    return { week: w + 1, sessions, avgBounce: Math.round(bounceRate * 100) };
  }).filter(Boolean) as { week: number; sessions: number; avgBounce: number }[];

  const weekTrend = weeks.length >= 2
    ? Math.round(((weeks[weeks.length - 1].sessions - weeks[0].sessions) / Math.max(weeks[0].sessions, 1)) * 100)
    : 0;

  const weeklyStr = weeks.map((w) => `${w.week}주차: ${w.sessions}세션, 이탈률 ${w.avgBounce}%`).join(' / ');

  // ── Channel analysis ────────────────────────────────────────────────────
  const totalSessions = (channels ?? []).reduce((a: number, c: { sessions: number }) => a + c.sessions, 0) || 1;
  const channelStr = (channels ?? [])
    .map((c: { channel: string; sessions: number; conversions: number }) => {
      const pct = Math.round((c.sessions / totalSessions) * 100);
      return `${c.channel}: ${c.sessions}세션(${pct}%), 전환 ${c.conversions}회`;
    })
    .join('\n');

  const organicPct = Math.round(
    (((channels ?? []).find((c: { channel: string }) => c.channel === 'Organic Search')?.sessions ?? 0) / totalSessions) * 100
  );
  const directPct = Math.round(
    (((channels ?? []).find((c: { channel: string }) => c.channel === 'Direct')?.sessions ?? 0) / totalSessions) * 100
  );

  // ── New vs returning ratio ──────────────────────────────────────────────
  const returningUsers = Math.max(0, (totals?.activeUsers ?? 0) - (totals?.newUsers ?? 0));
  const newRatio = totals?.activeUsers > 0 ? Math.round((totals.newUsers / totals.activeUsers) * 100) : 0;

  // ── Top pages ───────────────────────────────────────────────────────────
  const topPagesStr = (topPages ?? [])
    .slice(0, 8)
    .map((p: { path: string; pageViews: number; bounceRate: number; avgDuration: number; activeUsers: number }) =>
      `${p.path}: PV ${p.pageViews}, 이탈률 ${Math.round(p.bounceRate * 100)}%, 체류 ${Math.round(p.avgDuration)}초, 활성사용자 ${p.activeUsers}`
    )
    .join('\n');

  const deviceStr = (devices ?? [])
    .map((d: { device: string; sessions: number }) => {
      const pct = Math.round((d.sessions / totalSessions) * 100);
      return `${d.device}: ${d.sessions}세션(${pct}%)`;
    })
    .join(', ');

  const avgDailySessions = Math.round((totals?.sessions ?? 0) / 30);
  const sessionDuration = totals?.avgSessionDuration ?? 0;

  const prompt = `당신은 선임 디지털 마케팅 애널리스트이자 성장 전략가입니다. GA4 데이터를 바탕으로 전문 마케팅 보고서 수준의 인사이트를 제공해야 합니다.

[분석 대상 사이트]
${siteUrl || '(미입력)'}

[핵심 지표 — 최근 30일]
- 총 세션: ${totals?.sessions ?? 0} (일평균 ${avgDailySessions}세션)
- 활성 사용자: ${totals?.activeUsers ?? 0}명 (신규 ${totals?.newUsers ?? 0}명 / 재방문 ${returningUsers}명, 신규비율 ${newRatio}%)
- 페이지뷰: ${totals?.pageViews ?? 0}
- 평균 이탈률: ${totals?.avgBounceRate ?? 0}%
- 평균 세션 시간: ${Math.floor(sessionDuration / 60)}분 ${sessionDuration % 60}초
- 트렌드(1주→마지막주): ${weekTrend > 0 ? '+' : ''}${weekTrend}%

[주차별 세션 추이]
${weeklyStr || '데이터 없음'}

[채널별 트래픽]
${channelStr || '데이터 없음'}
* 오가닉 검색 비중: ${organicPct}%, 다이렉트 비중: ${directPct}%

[상위 페이지 (PV 순)]
${topPagesStr || '데이터 없음'}

[기기 비중]
${deviceStr || '데이터 없음'}

---

위 데이터를 분석하여 반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.
각 항목은 수치를 포함한 구체적이고 실행 가능한 내용이어야 합니다.

{
  "healthScore": 0~100 사이의 정수 (마케팅 건강도 종합 점수),
  "executiveSummary": "임원이 30초 안에 파악할 수 있는 현황 요약. 핵심 수치(세션, 이탈률, 트렌드방향 등)를 포함한 2~3문장",
  "keyFindings": [
    "핵심 발견 1 (반드시 수치 포함)",
    "핵심 발견 2 (반드시 수치 포함)",
    "핵심 발견 3 (반드시 수치 포함)",
    "핵심 발견 4 (반드시 수치 포함)"
  ],
  "trendDirection": "growing 또는 declining 또는 stable 중 하나",
  "trendNarrative": "주차별 추이를 분석한 내용. 어떤 시기에 트래픽이 변했는지, 이유는 무엇인지 2문장",
  "channelInsight": "채널 의존도와 리스크 분석. 특정 채널 쏠림 현상이 있는지, 다각화 전략이 필요한지 2문장",
  "audienceInsight": "신규/재방문 비율, 세션 시간, 이탈률로 파악한 오디언스 품질 분석. 충성도 평가 포함 2문장",
  "risks": [
    { "title": "위험 제목", "severity": "high 또는 medium 또는 low", "detail": "구체적인 수치를 포함한 위험 설명", "action": "즉각 취해야 할 대응 액션" },
    { "title": "위험 제목", "severity": "high 또는 medium 또는 low", "detail": "구체적인 수치를 포함한 위험 설명", "action": "즉각 취해야 할 대응 액션" },
    { "title": "위험 제목", "severity": "medium 또는 low", "detail": "구체적인 수치를 포함한 위험 설명", "action": "즉각 취해야 할 대응 액션" }
  ],
  "strengths": [
    { "title": "강점 제목", "detail": "수치 기반 강점 설명" },
    { "title": "강점 제목", "detail": "수치 기반 강점 설명" }
  ],
  "quickWins": [
    { "action": "이번 주 실행할 액션 (매우 구체적으로)", "detail": "어떻게 실행하는지 설명", "kpi": "어떤 지표가 얼마나 개선될 것인지", "effort": "낮음 또는 보통" },
    { "action": "이번 주 실행할 액션", "detail": "어떻게 실행하는지 설명", "kpi": "예상 KPI 개선", "effort": "낮음 또는 보통" },
    { "action": "이번 주 실행할 액션", "detail": "어떻게 실행하는지 설명", "kpi": "예상 KPI 개선", "effort": "낮음 또는 보통" }
  ],
  "monthlyGoals": [
    { "goal": "이번 달 핵심 목표 (수치 포함)", "strategy": "구체적인 실행 전략 2~3단계", "kpi": "측정할 KPI와 목표치" },
    { "goal": "이번 달 핵심 목표 (수치 포함)", "strategy": "구체적인 실행 전략 2~3단계", "kpi": "측정할 KPI와 목표치" },
    { "goal": "이번 달 핵심 목표 (수치 포함)", "strategy": "구체적인 실행 전략 2~3단계", "kpi": "측정할 KPI와 목표치" }
  ],
  "quarterlyVision": "3개월 후 이 사이트가 달성해야 할 마케팅 목표와 방향성을 2문장으로"
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
