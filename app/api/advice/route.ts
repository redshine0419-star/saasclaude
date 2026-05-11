import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { url, geoData, analyzeData } = await req.json();

  if (!geoData || !analyzeData) {
    return NextResponse.json({ error: '분석 데이터가 없습니다.' }, { status: 400 });
  }

  const mobile = analyzeData.mobile;

  const jsonLdStr = geoData.jsonLd.exists
    ? '있음 (' + geoData.jsonLd.types.join(', ') + ')'
    : '없음';
  const issuesStr = geoData.issues
    .map((i: { title: string; detail: string; impact: string }) => '- [' + i.impact + '] ' + i.title + ': ' + i.detail)
    .join('\n');

  const prompt = '당신은 10년차 SEO/GEO 전문 마케터입니다. 아래 웹사이트 진단 결과를 바탕으로 우선순위가 높은 개선 액션 플랜을 작성하세요.\n\n' +
    '[분석 대상 URL]\n' + url + '\n\n' +
    '[PageSpeed 점수 (모바일)]\n' +
    '- Performance: ' + mobile.scores.performance + '/100\n' +
    '- SEO: ' + mobile.scores.seo + '/100\n' +
    '- Accessibility: ' + mobile.scores.accessibility + '/100\n\n' +
    '[Core Web Vitals]\n' +
    '- LCP: ' + mobile.vitals.lcp + '\n' +
    '- CLS: ' + mobile.vitals.cls + '\n' +
    '- TBT: ' + mobile.vitals.tbt + '\n' +
    '- FCP: ' + mobile.vitals.fcp + '\n\n' +
    '[GEO 가시성 점수]\n' +
    '- GEO Score: ' + geoData.score + '/100\n' +
    '- llms.txt: ' + (geoData.llmsTxt.exists ? '있음' : '없음') + '\n' +
    '- JSON-LD: ' + jsonLdStr + '\n' +
    '- AI 봇 차단: ' + (geoData.robotsTxt.llmBlocked ? '차단됨' : '허용됨') + '\n' +
    '- Meta Description: ' + (geoData.metaTags.description ? '있음' : '없음') + '\n' +
    '- H1 태그: ' + (geoData.headings.h1.length > 0 ? geoData.headings.h1[0] : '없음') + '\n' +
    '- 이미지 Alt 누락: ' + geoData.images.missingAlt + '/' + geoData.images.total + '개\n\n' +
    '[발견된 이슈]\n' + issuesStr

 + '\n\n다음 형식으로 답변하세요:\n\n' +
    '## 종합 진단\n(2~3문장으로 현재 상태 핵심 요약)\n\n' +
    '## 즉시 실행 가능한 액션 (이번 주)\n1. (구체적인 실행 방법 포함)\n2.\n3.\n\n' +
    '## 중기 개선 과제 (이번 달)\n1.\n2.\n\n' +
    '## AI 시대 GEO 전략 제언\n(LLM 검색 최적화를 위한 핵심 조언 2~3가지)';

  try {
    const { text } = await generateText(prompt);
    return NextResponse.json({ advice: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'AI 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
