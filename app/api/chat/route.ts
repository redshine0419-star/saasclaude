import { NextRequest, NextResponse } from 'next/server';
import { generateChat } from '@/lib/ai';

const SYSTEM_PROMPT = `당신은 MarketerOps.ai의 AI 마케팅 어시스턴트입니다.
MarketerOps.ai는 다음 9가지 무료 AI 마케팅 도구를 제공합니다:
- Engine Diagnosis: URL 입력 시 PageSpeed + GEO 가시성(AI 검색엔진 크롤링 가능성) 즉시 분석
- Competitor Analysis: 경쟁사 URL 비교 + AI 격차 분석
- Content Orchestrator: 소스 하나로 블로그·SNS·뉴스레터·광고 4채널 콘텐츠 자동 생성
- Content Rewriter: SEO/GEO/가독성 목표별 AI 리라이팅
- Keyword Analysis: 검색 의도·경쟁도·롱테일·클러스터링 분석
- llms.txt Generator: AI 검색엔진 크롤링용 llms.txt 자동 생성
- GA4 Analytics: GA4 데이터 AI 분석 + 인사이트
- AI Share of Voice: ChatGPT·Gemini 내 브랜드 언급율 측정
- Ops Dashboard: 진단 이력·콘텐츠 통계 종합 대시보드

마케팅, SEO, GEO(AI 검색 최적화), 콘텐츠 전략에 대한 질문에 친절하고 전문적으로 답변하세요.
한국어로 질문하면 한국어로, 영어로 질문하면 영어로 답변하세요.
답변은 간결하고 실용적으로 작성하세요 (3~5문장 이내).`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: '메시지가 없습니다.' }, { status: 400 });
  }

  try {
    const chatMessages = messages.map((m: { role: string; content: string }) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }));

    const { text } = await generateChat(SYSTEM_PROMPT, chatMessages);
    return NextResponse.json({ reply: text });
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    console.error('[chat] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
