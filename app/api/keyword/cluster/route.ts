import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { keywords } = await req.json();

  if (!Array.isArray(keywords) || keywords.length < 2) {
    return NextResponse.json({ error: '키워드를 2개 이상 입력해주세요.' }, { status: 400 });
  }
  if (keywords.length > 30) {
    return NextResponse.json({ error: '키워드는 최대 30개까지 입력 가능합니다.' }, { status: 400 });
  }

  const kwList = keywords.map((k: string, i: number) => (i + 1) + '. ' + k).join('\n');

  const prompt =
    '당신은 SEO 전문가입니다. 다음 키워드 목록을 검색 의도별로 클러스터링하세요.\n\n' +
    '키워드 목록:\n' + kwList + '\n\n' +
    '검색 의도 유형: 정보형 / 거래형 / 비교형 / 탐색형 / 로컬형\n\n' +
    '규칙:\n' +
    '- 의미가 유사하거나 같은 의도를 가진 키워드끼리 묶으세요\n' +
    '- 각 클러스터에 대표 키워드(pillar)를 선정하세요\n' +
    '- 빈 클러스터는 포함하지 마세요\n' +
    '- 마크다운 없이 순수 JSON만 출력하세요\n\n' +
    'JSON 구조:\n' +
    '{\n' +
    '  "clusters": [\n' +
    '    {\n' +
    '      "intent": "정보형",\n' +
    '      "pillar": "대표 키워드",\n' +
    '      "keywords": ["키워드1", "키워드2"],\n' +
    '      "description": "이 그룹의 특징 1~2문장",\n' +
    '      "contentIdea": "추천 콘텐츠 유형 및 방향 1문장"\n' +
    '    }\n' +
    '  ],\n' +
    '  "summary": "전체 키워드 세트의 전략적 의미 2~3문장"\n' +
    '}';

  try {
    const { text: rawText } = await generateText(prompt);
    const text = rawText.trim();
    const jsonStr = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const data = JSON.parse(jsonStr);
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '클러스터링 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
