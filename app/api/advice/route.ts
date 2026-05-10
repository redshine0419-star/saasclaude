import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export async function POST(req: NextRequest) {
  const { url, geoData, analyzeData } = await req.json();

  if (!geoData || !analyzeData) {
    return NextResponse.json({ error: '분석 데이터가 없습니다.' }, { status: 400 });
  }

  const mobile = analyzeData.mobile;

  const prompt = `당신은 10년차 SEO/GEO 전문 마케터입니다. 아래 웹사이트 진단 결과를 바탕으로 우선순위가 높은 개선 액션 플랜을 작성하세요.

[분석 대상 URL]
${url}

[PageSpeed 점수 (모바일)]
- Performance: ${mobile.scores.performance}/100
- SEO: ${mobile.scores.seo}/100
- Accessibility: ${mobile.scores.accessibility}/100

[Core Web Vitals]
- LCP: ${mobile.vitals.lcp}
- CLS: ${mobile.vitals.cls}
- TBT: ${mobile.vitals.tbt}
- FCP: ${mobile.vitals.fcp}

[GEO 가시성 점수]
- GEO Score: ${geoData.score}/100
- llms.txt: ${geoData.llmsTxt.exists ? '있음' : '없음'}
- JSON-LD: ${geoData.jsonLd.exists ? \`있음 (\${geoData.jsonLd.types.join(', ')})\` : '없음'}
- AI 봇 차단: ${geoData.robotsTxt.llmBlocked ? '차단됨' : '허용됨'}
- Meta Description: ${geoData.metaTags.description ? '있음' : '없음'}
- H1 태그: ${geoData.headings.h1.length > 0 ? geoData.headings.h1[0] : '없음'}
- 이미지 Alt 누락: ${geoData.images.missingAlt}/${geoData.images.total}개

[발견된 이슈]
${geoData.issues.map((i: { title: string; detail: string; impact: string }) => \`- [\${i.impact}] \${i.title}: \${i.detail}\`).join('\n')}

다음 형식으로 답변하세요:

## 종합 진단
(2~3문장으로 현재 상태 핵심 요약)

## 즉시 실행 가능한 액션 (이번 주)
1. (구체적인 실행 방법 포함)
2.
3.

## 중기 개선 과제 (이번 달)
1.
2.

## AI 시대 GEO 전략 제언
(LLM 검색 최적화를 위한 핵심 조언 2~3가지)`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return NextResponse.json({ advice: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'AI 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
