import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { company, industry } = await req.json();

  if (!company?.trim() || !industry?.trim()) {
    return NextResponse.json({ error: '회사명과 업종을 입력해주세요.' }, { status: 400 });
  }

  const prompt =
    '당신은 AI 브랜드 언급율(Share of Voice) 측정 전문가입니다.\n' +
    '아래 업종에서 실제 고객이 AI에게 물어볼 법한 질문 프롬프트 6개를 생성해주세요.\n\n' +
    '업종/카테고리: ' + industry + '\n\n' +
    '요구사항:\n' +
    '- 실제 사용자가 ChatGPT나 Gemini에 입력할 법한 자연스러운 질문이어야 합니다\n' +
    '- 질문 유형을 다양하게: 추천 요청, 도구 비교, TOP 리스트, 문제 해결 방법, 시장 조사 등\n' +
    '- 각 질문은 40자 이내로 간결하게\n' +
    '- 반드시 특정 회사명이나 브랜드명을 질문에 포함하지 마세요 — 업종/카테고리 기반의 일반적인 질문만\n' +
    '- 예시: "SEO 최적화 도구 추천해줘", "중소기업에 좋은 마케팅 SaaS는?" (특정 회사명 X)\n\n' +
    '아래 JSON 배열 형식으로만 응답하세요. 설명 없이 JSON만:\n' +
    '["질문1", "질문2", "질문3", "질문4", "질문5", "질문6"]';

  try {
    const { text } = await generateText(prompt);
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) throw new Error('프롬프트 생성 실패');
    const prompts: string[] = JSON.parse(match[0]);
    if (!Array.isArray(prompts) || prompts.length === 0) throw new Error('프롬프트 파싱 실패');
    // 회사명이 포함된 질문은 제거 (대소문자 무시)
    const filtered = prompts.filter(p => !p.toLowerCase().includes(company.toLowerCase()));
    const final = filtered.length > 0 ? filtered : prompts; // 전부 필터링된 경우 원본 사용
    return NextResponse.json({ prompts: final.slice(0, 6) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
