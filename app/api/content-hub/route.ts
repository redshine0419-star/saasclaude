import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

type ChannelKey = 'blog' | 'social' | 'newsletter' | 'ads';
type Tone = 'friendly' | 'professional' | 'humorous' | 'emotional';

const TONE_DESC: Record<Tone, string> = {
  friendly:     '친근하고 대화하듯 편안한 톤',
  professional: '전문적이고 신뢰감 있는 비즈니스 톤',
  humorous:     '유머러스하고 재치 있는 톤',
  emotional:    '감성적이고 공감을 이끄는 스토리텔링 톤',
};

function buildPrompt(channel: ChannelKey, topic: string, tone: Tone): string {
  const toneDesc = TONE_DESC[tone];

  if (channel === 'blog') return `SEO 최적화 블로그 본문을 작성하세요.
주제: ${topic}
톤: ${toneDesc}
조건: H2 소제목 2~3개, 800자 내외, 자연스러운 키워드 배치, 행동 유도 CTA 마무리`;

  if (channel === 'social') return `인스타그램 카드뉴스 기획안을 작성하세요.
주제: ${topic}
톤: ${toneDesc}
조건: 카드 5장 (각 제목+내용 2~3줄), 첫 장 강렬한 후킹, 마지막 장 저장/팔로우 CTA, 해시태그 10개`;

  if (channel === 'newsletter') return `이메일 뉴스레터를 작성하세요.
주제: ${topic}
톤: ${toneDesc}
조건: 개봉률 높은 Subject 3가지, 프리헤더 1줄, 인사→핵심가치→CTA 구조, 600자 내외`;

  // ads
  return `A/B 테스트용 광고 카피를 작성하세요.
주제: ${topic}
톤: ${toneDesc}
조건: A안(혜택/가치 중심), B안(문제/공감 중심) 각각 헤드라인 30자↓+본문 90자↓+CTA`;
}

export async function POST(req: NextRequest) {
  const { topic, tone = 'friendly', channels = ['blog', 'social', 'newsletter', 'ads'] } =
    await req.json() as { topic: string; tone: Tone; channels: ChannelKey[] };

  if (!topic?.trim()) {
    return NextResponse.json({ error: '주제를 입력해주세요.' }, { status: 400 });
  }

  const validChannels = (channels as string[]).filter((c): c is ChannelKey =>
    ['blog', 'social', 'newsletter', 'ads'].includes(c)
  );
  if (validChannels.length === 0) {
    return NextResponse.json({ error: '채널을 하나 이상 선택해주세요.' }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      validChannels.map((ch) => generateText(buildPrompt(ch, topic.trim(), tone)))
    );

    const output: Partial<Record<ChannelKey, string>> = {};
    validChannels.forEach((ch, i) => {
      output[ch] = results[i].text;
    });

    return NextResponse.json(output);
  } catch (e) {
    console.error('[content-hub]', e);
    return NextResponse.json({ error: 'AI_FAILED' }, { status: 500 });
  }
}
