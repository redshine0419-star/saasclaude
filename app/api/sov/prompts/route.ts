import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { company, industry } = await req.json();

  if (!company?.trim() || !industry?.trim()) {
    return NextResponse.json({ error: '회사명과 업종을 입력해주세요.' }, { status: 400 });
  }

  const prompt =
    '당신은 AI 브랜드 언급율(Share of Voice) 측정 전문가입니다.\n' +
    '아래 회사와 업종에 맞는 AI 검색 프롬프트 6개를 생성해주세요.\n\n' +
    '회사명: ' + company + '\n' +
    '업종/카테고리: ' + industry + '\n\n' +
    '요구사항:\n' +
    '- 실제 사용자가 ChatGPT나 Gemini에 입력할 법한 자연스러운 질문이어야 합니다\n' +
    '- 질문 유형을 다양하게 구성하세요: 추천 요청, 비교, TOP 리스트, 구체적 문제 해결, 브랜드 직접 질문 등\n' +
    '- 각 질문은 30자 이내로 간결하게\n' +
    '- 해당 업종의 실제 고객이 검색할 내용으로\n\n' +
    '아래 JSON 배열 형식으로만 응답하세요. 설명 없이 JSON만:\n' +
    '["질문1", "질문2", "질문3", "질문4", "질문5", "질문6"]';

  try {
    const { text } = await generateText(prompt);
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) throw new Error('프롬프트 생성 실패');
    const prompts: string[] = JSON.parse(match[0]);
    if (!Array.isArray(prompts) || prompts.length === 0) throw new Error('프롬프트 파싱 실패');
    return NextResponse.json({ prompts: prompts.slice(0, 6) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
