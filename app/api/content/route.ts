import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.Gemini_API_Key ?? '');

const prompts = {
  blog: (input: string) => `당신은 10년차 SEO 전문 콘텐츠 마케터입니다.
아래 핵심 내용을 바탕으로 SEO 최적화된 블로그 본문을 작성하세요.

[핵심 내용]
${input}

조건:
- 검색 의도를 고려한 자연스러운 키워드 배치
- H2 소제목 2~3개 포함
- 800자 내외
- 독자가 실제로 행동하게 만드는 CTA 마무리`,

  social: (input: string) => `당신은 인스타그램 바이럴 콘텐츠 전문가입니다.
아래 핵심 내용을 바탕으로 인스타그램 카드뉴스 기획안을 작성하세요.

[핵심 내용]
${input}

조건:
- 카드 5장 구성 (각 카드별 제목 + 내용 2~3줄)
- 첫 장은 강렬한 후킹 문구
- 마지막 장은 팔로우/저장 유도 CTA
- 해시태그 10개 포함`,

  newsletter: (input: string) => `당신은 이메일 마케팅 전문가입니다.
아래 핵심 내용을 바탕으로 고객 맞춤 이메일 뉴스레터를 작성하세요.

[핵심 내용]
${input}

조건:
- 제목(Subject): 개봉률 높은 이메일 제목 3가지 제안
- 프리헤더 텍스트 1줄
- 본문: 인사말 → 핵심 가치 전달 → CTA 버튼 텍스트
- 600자 내외, 친근하고 전문적인 톤`,

  ads: (input: string) => `당신은 퍼포먼스 마케팅 카피라이터입니다.
아래 핵심 내용을 바탕으로 A/B 테스트용 광고 카피를 작성하세요.

[핵심 내용]
${input}

조건:
- A안: 혜택/가치 중심 카피 (헤드라인 + 본문 + CTA)
- B안: 문제/공감 중심 카피 (헤드라인 + 본문 + CTA)
- 각 헤드라인 30자 이내, 본문 90자 이내
- 클릭을 유도하는 강력한 CTA`,
};

export async function POST(req: NextRequest) {
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const [blog, social, newsletter, ads] = await Promise.all([
      model.generateContent(prompts.blog(content)).then((r) => r.response.text()),
      model.generateContent(prompts.social(content)).then((r) => r.response.text()),
      model.generateContent(prompts.newsletter(content)).then((r) => r.response.text()),
      model.generateContent(prompts.ads(content)).then((r) => r.response.text()),
    ]);

    return NextResponse.json({ blog, social, newsletter, ads });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '콘텐츠 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
