import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { urlA, urlB, dataA, dataB } = await req.json();

  if (!dataA || !dataB) {
    return NextResponse.json({ error: '분석 데이터가 없습니다.' }, { status: 400 });
  }

  const formatSite = (label: string, url: string, analyze: { mobile: { scores: Record<string, number>; vitals: Record<string, string> } }, geo: { score: number; issues: { title: string; impact: string }[]; llmsTxt: { exists: boolean }; jsonLd: { exists: boolean; types: string[] }; robotsTxt: { llmBlocked: boolean } }) => {
    return '[' + label + '] ' + url + '\n' +
      '- Performance: ' + analyze.mobile.scores.performance + '/100\n' +
      '- SEO: ' + analyze.mobile.scores.seo + '/100\n' +
      '- Accessibility: ' + analyze.mobile.scores.accessibility + '/100\n' +
      '- GEO Score: ' + geo.score + '/100\n' +
      '- LCP: ' + analyze.mobile.vitals.lcp + ', CLS: ' + analyze.mobile.vitals.cls + ', TBT: ' + analyze.mobile.vitals.tbt + '\n' +
      '- llms.txt: ' + (geo.llmsTxt.exists ? '있음' : '없음') + '\n' +
      '- JSON-LD: ' + (geo.jsonLd.exists ? '있음 (' + geo.jsonLd.types.join(', ') + ')' : '없음') + '\n' +
      '- AI 봇 차단: ' + (geo.robotsTxt.llmBlocked ? '차단됨' : '허용됨') + '\n' +
      '- 주요 이슈: ' + (geo.issues.slice(0, 3).map((i: { title: string; impact: string }) => '[' + i.impact + '] ' + i.title).join(', ') || '없음');
  };

  const prompt = '당신은 10년차 디지털 마케팅 전략가입니다. 아래 두 사이트의 SEO/GEO 분석 결과를 비교하고 전략적 인사이트를 제공하세요.\n\n' +
    formatSite('내 사이트', urlA, dataA.analyze, dataA.geo) + '\n\n' +
    formatSite('경쟁사', urlB, dataB.analyze, dataB.geo) + '\n\n' +
    '다음 JSON 형식으로만 답변하세요 (마크다운 코드블록 없이 순수 JSON):\n' +
    '{\n' +
    '  "summary": "2~3문장 핵심 비교 요약",\n' +
    '  "myStrengths": ["내 사이트 강점1", "강점2", "강점3"],\n' +
    '  "myWeaknesses": ["내 사이트 약점1", "약점2", "약점3"],\n' +
    '  "competitorStrengths": ["경쟁사 강점1", "강점2"],\n' +
    '  "opportunities": ["즉시 실행 가능한 개선 기회1", "기회2", "기회3"],\n' +
    '  "priorityActions": [\n' +
    '    { "action": "구체적인 액션", "impact": "High 또는 Medium 또는 Low", "effort": "쉬움 또는 보통 또는 어려움" },\n' +
    '    { "action": "구체적인 액션", "impact": "High 또는 Medium 또는 Low", "effort": "쉬움 또는 보통 또는 어려움" },\n' +
    '    { "action": "구체적인 액션", "impact": "High 또는 Medium 또는 Low", "effort": "쉬움 또는 보통 또는 어려움" }\n' +
    '  ]\n' +
    '}';

  try {
    const { text: rawText } = await generateText(prompt);
    const text = rawText.trim();
    const jsonStr = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '비교 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
