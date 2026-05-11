import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

const GOAL_PROMPTS: Record<string, string> = {
  seo: 'SEO 최적화: 타겟 키워드를 자연스럽게 포함하고, 검색 의도에 맞는 헤딩 구조(H2/H3)와 메타 설명 초안을 함께 제안하세요.',
  geo: 'GEO(AI 검색 최적화): AI 언어모델이 콘텐츠를 정확히 이해하고 인용할 수 있도록 명확한 팩트, 구조화된 정보, FAQ 형식을 적극 활용하세요.',
  readability: '가독성 개선: 문장을 짧고 명확하게 만들고, 불필요한 수식어를 제거하며, 단락을 논리적으로 재구성하세요.',
  concise: '간결화: 핵심 메시지는 유지하면서 분량을 30~50% 줄이세요. 반복 표현과 군더더기를 제거하세요.',
};

export async function POST(req: NextRequest) {
  const { content, goal } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: '콘텐츠를 입력해주세요.' }, { status: 400 });
  }

  const goalDesc = GOAL_PROMPTS[goal] ?? GOAL_PROMPTS.seo;

  const prompt = '당신은 10년차 카피라이터 겸 SEO 전문가입니다.\n' +
    '아래 원본 텍스트를 다음 목표에 맞게 리라이팅하세요.\n\n' +
    '목표: ' + goalDesc + '\n\n' +
    '원본 텍스트:\n' +
    '---\n' +
    content + '\n' +
    '---\n\n' +
    '다음 JSON 형식으로만 답변하세요 (마크다운 코드블록 없이 순수 JSON):\n' +
    '{\n' +
    '  "rewritten": "리라이팅된 전체 텍스트",\n' +
    '  "keyChanges": [\n' +
    '    "변경 사항 1 (구체적으로)",\n' +
    '    "변경 사항 2",\n' +
    '    "변경 사항 3",\n' +
    '    "변경 사항 4",\n' +
    '    "변경 사항 5"\n' +
    '  ],\n' +
    '  "seoScore": "리라이팅 후 예상 SEO 효과 (예: 검색 노출 가능성 30% 향상)",\n' +
    '  "readabilityNote": "가독성 개선 요약 1문장"\n' +
    '}';

  try {
    const { text: rawText } = await generateText(prompt);
    const text = rawText.trim();
    const jsonStr = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return NextResponse.json(JSON.parse(jsonStr));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '리라이팅 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
