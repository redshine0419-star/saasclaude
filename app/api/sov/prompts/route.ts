import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { company, industry } = await req.json();

  if (!company?.trim() || !industry?.trim()) {
    return NextResponse.json({ error: '회사명과 업종을 입력해주세요.' }, { status: 400 });
  }

  const prompt =
    '당신은 AI 브랜드 언급율(Share of Voice) 측정 전문가입니다.\n' +
    '목표: AI(ChatGPT, Gemini 등)가 답변할 때 "' + industry + '" 업종의 서비스나 업체를 자연스럽게 언급하게 만드는 질문 6개를 생성하세요.\n\n' +
    '업종/카테고리: ' + industry + '\n\n' +
    '좋은 질문의 조건:\n' +
    '- 사용자가 이 질문을 하면 AI가 "' + industry + '" 관련 업체나 서비스를 추천하거나 비교할 수밖에 없는 질문\n' +
    '- 실제 잠재 고객이 구매/이용 전에 AI에게 물어볼 법한 질문\n' +
    '- 특정 회사명은 절대 포함하지 말 것\n' +
    '- 너무 일반적이거나 해당 업종과 관련 없는 질문은 제외\n' +
    '- 각 질문은 50자 이내\n\n' +
    '질문 유형을 다양하게 포함하세요:\n' +
    '  1) 서비스 추천 ("~하려면 어디가 좋나요?")\n' +
    '  2) 업체 비교 ("A vs B 어디가 더 나은가요?")\n' +
    '  3) TOP 리스트 ("~분야 유명한 곳 알려줘")\n' +
    '  4) 고민/문제 해결 ("~할 때 어떤 서비스 이용하면 되나요?")\n' +
    '  5) 선택 기준 ("~고를 때 뭘 봐야 하나요?")\n' +
    '  6) 비용/가성비 ("~비용 아끼려면?")\n\n' +
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
