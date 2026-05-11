import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { data, siteUrl } = await req.json();

  if (!data) {
    return NextResponse.json({ error: '분석할 데이터가 없습니다.' }, { status: 400 });
  }

  const { totals, channels, topPages, devices, trend } = data;

  const channelStr = (channels ?? [])
    .map((c: { channel: string; sessions: number; conversions: number }) =>
      '- ' + c.channel + ': ' + c.sessions + '세션, 전환 ' + c.conversions + '회')
    .join('\n');

  const topPagesStr = (topPages ?? [])
    .slice(0, 5)
    .map((p: { path: string; pageViews: number; bounceRate: number; avgDuration: number }) =>
      '- ' + p.path + ': PV ' + p.pageViews + ', 이탈률 ' + Math.round(p.bounceRate * 100) + '%, 체류 ' + Math.round(p.avgDuration) + '초')
    .join('\n');

  const deviceStr = (devices ?? [])
    .map((d: { device: string; sessions: number }) => '- ' + d.device + ': ' + d.sessions + '세션')
    .join('\n');

  const recentTrend = (trend ?? []).slice(-7);
  const trendStr = recentTrend
    .map((t: { date: string; sessions: number; bounceRate: number }) =>
      t.date + ': ' + t.sessions + '세션, 이탈률 ' + Math.round(t.bounceRate * 100) + '%')
    .join('\n');

  const prompt = '당신은 10년차 GA4 전문 마케터이자 성장 해커입니다.\n' +
    '아래 GA4 데이터(최근 30일)를 분석하여 구체적인 개선 전략을 제시하세요.\n\n' +
    '[분석 대상]\n' +
    '사이트: ' + (siteUrl || '미입력') + '\n\n' +
    '[종합 지표]\n' +
    '- 총 세션: ' + (totals?.sessions ?? 0) + '\n' +
    '- 활성 사용자: ' + (totals?.activeUsers ?? 0) + '\n' +
    '- 신규 사용자: ' + (totals?.newUsers ?? 0) + '\n' +
    '- 페이지뷰: ' + (totals?.pageViews ?? 0) + '\n' +
    '- 평균 이탈률: ' + (totals?.avgBounceRate ?? 0) + '%\n' +
    '- 평균 세션 시간: ' + Math.floor((totals?.avgSessionDuration ?? 0) / 60) + '분 ' + ((totals?.avgSessionDuration ?? 0) % 60) + '초\n\n' +
    '[채널별 트래픽]\n' + (channelStr || '데이터 없음') + '\n\n' +
    '[상위 페이지]\n' + (topPagesStr || '데이터 없음') + '\n\n' +
    '[기기별]\n' + (deviceStr || '데이터 없음') + '\n\n' +
    '[최근 7일 트렌드]\n' + (trendStr || '데이터 없음') + '\n\n' +
    '다음 JSON 형식으로만 답변하세요 (마크다운 코드블록 없이 순수 JSON):\n' +
    '{\n' +
    '  "healthScore": 0~100 숫자 (전반적인 마케팅 건강도),\n' +
    '  "summary": "2~3문장 핵심 현황 요약",\n' +
    '  "strengths": ["잘 되고 있는 점 1", "잘 되고 있는 점 2"],\n' +
    '  "risks": ["위험 신호 1 (수치 포함)", "위험 신호 2"],\n' +
    '  "trafficInsight": "트래픽 패턴에 대한 핵심 인사이트 2~3문장",\n' +
    '  "contentInsight": "콘텐츠 성과에 대한 핵심 인사이트 2~3문장",\n' +
    '  "quickWins": [\n' +
    '    { "action": "이번 주 실행 가능한 액션", "expectedImpact": "예상 효과", "effort": "낮음 또는 보통" },\n' +
    '    { "action": "이번 주 실행 가능한 액션", "expectedImpact": "예상 효과", "effort": "낮음 또는 보통" },\n' +
    '    { "action": "이번 주 실행 가능한 액션", "expectedImpact": "예상 효과", "effort": "낮음 또는 보통" }\n' +
    '  ],\n' +
    '  "monthlyGoals": [\n' +
    '    { "goal": "이번 달 목표", "strategy": "구체적인 전략" },\n' +
    '    { "goal": "이번 달 목표", "strategy": "구체적인 전략" }\n' +
    '  ]\n' +
    '}';

  try {
    const { text: rawText } = await generateText(prompt);
    const text = rawText.trim();
    const jsonStr = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'AI 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
