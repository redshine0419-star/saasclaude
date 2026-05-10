import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export async function POST(req: NextRequest) {
  const { name, description, services, urls, audience, instructions, blockedSections } = await req.json();

  if (!name?.trim() || !description?.trim()) {
    return NextResponse.json({ error: '회사명과 소개는 필수입니다.' }, { status: 400 });
  }

  const prompt = '당신은 GEO(Generative Engine Optimization) 전문가입니다.\n' +
    '아래 정보를 바탕으로 표준 llms.txt 파일을 생성하세요.\n\n' +
    '[회사/브랜드 정보]\n' +
    '- 이름: ' + name + '\n' +
    '- 소개: ' + description + '\n' +
    '- 서비스/제품: ' + (services || '미입력') + '\n' +
    '- 타겟 고객: ' + (audience || '미입력') + '\n' +
    '- 주요 URL: ' + (urls || '미입력') + '\n' +
    '- AI 봇 안내 메시지: ' + (instructions || '없음') + '\n' +
    '- 비공개 섹션: ' + (blockedSections || '없음') + '\n\n' +
    'llms.txt 표준 형식:\n' +
    '- 첫 줄: # 브랜드명\n' +
    '- 공식 설명 (> 로 시작하는 blockquote)\n' +
    '- ## 섹션별 정보 (About, Products/Services, Audience, Key URLs, Instructions for AI)\n' +
    '- 영어와 한국어를 함께 사용 (이중 언어)\n' +
    '- 구체적이고 AI가 인용하기 좋은 팩트 중심 문장\n\n' +
    '완성된 llms.txt 전체 내용만 출력하세요 (JSON 아님, 마크다운 코드블록 없이 plain text).';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const content = text.replace(/^```[\w]*\s*/i, '').replace(/\s*```$/i, '').trim();
    return NextResponse.json({ content });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'llms.txt 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
