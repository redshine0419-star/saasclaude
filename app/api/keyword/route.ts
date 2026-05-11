import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { keyword } = await req.json();

  if (!keyword?.trim()) {
    return NextResponse.json({ error: '키워드를 입력해주세요.' }, { status: 400 });
  }

  const prompt = '당신은 10년차 SEO/콘텐츠 마케팅 전문가입니다.\n' +
    '아래 키워드를 분석하고 반드시 JSON 형식으로만 답변하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.\n\n' +
    '키워드: ' + keyword + '\n\n' +
    '다음 JSON 구조로 출력하세요:\n' +
    '{\n' +
    '  "intent": "정보형 또는 거래형 또는 탐색형 또는 비교형",\n' +
    '  "intentDesc": "검색 의도 설명 1~2문장",\n' +
    '  "difficulty": "Low 또는 Medium 또는 High",\n' +
    '  "difficultyDesc": "경쟁도 설명 1~2문장",\n' +
    '  "monthlyVolume": "예상 월 검색량 범위 (예: 1,000~10,000)",\n' +
    '  "relatedKeywords": ["연관키워드1", "연관키워드2", "연관키워드3", "연관키워드4", "연관키워드5", "연관키워드6", "연관키워드7", "연관키워드8"],\n' +
    '  "longTailKeywords": ["롱테일키워드1", "롱테일키워드2", "롱테일키워드3", "롱테일키워드4"],\n' +
    '  "contentAngles": [\n' +
    '    { "title": "콘텐츠 방향 제목", "description": "콘텐츠 방향 설명" },\n' +
    '    { "title": "콘텐츠 방향 제목", "description": "콘텐츠 방향 설명" },\n' +
    '    { "title": "콘텐츠 방향 제목", "description": "콘텐츠 방향 설명" }\n' +
    '  ],\n' +
    '  "seoTitles": ["SEO 최적화 제목1", "SEO 최적화 제목2", "SEO 최적화 제목3"],\n' +
    '  "metaDescription": "메타 설명 예시 (150자 내외)"\n' +
    '}';

  try {
    const { text: rawText } = await generateText(prompt);
    const text = rawText.trim();

    const jsonStr = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '키워드 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
