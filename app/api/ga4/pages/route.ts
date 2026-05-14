import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

interface PageInput {
  path: string;
  title: string;
  pageViews: number;
  bounceRate: number;
  avgDuration: number;
  activeUsers: number;
  priority: '긴급' | '주의';
  issues: string[];
}

function extractJson(text: string): Record<string, unknown> | null {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (start === -1) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { pages, siteUrl } = (await req.json()) as { pages: PageInput[]; siteUrl?: string };

  if (!pages?.length) {
    return NextResponse.json({ error: '분석할 페이지 데이터가 없습니다.' }, { status: 400 });
  }

  const pagesStr = pages
    .map(
      (p, i) =>
        `${i + 1}. ${p.path}\n   제목: ${p.title || '(없음)'} | PV: ${p.pageViews} | 이탈률: ${Math.round(p.bounceRate * 100)}% | 체류시간: ${Math.round(p.avgDuration)}초 | 우선순위: ${p.priority} | 문제: ${p.issues.join(', ')}`
    )
    .join('\n');

  const prompt = `당신은 10년차 웹 마케팅 전문가이자 UX/SEO 컨설턴트입니다.
사이트: ${siteUrl || '(미입력)'}

아래 ${pages.length}개 페이지는 GA4 데이터 분석에서 개선이 시급한 페이지입니다.
각 페이지별로 문제 원인을 진단하고, 실행 가능한 구체적 개선안을 제시하세요.

[개선 필요 페이지]
${pagesStr}

다음 JSON 형식으로만 답변하세요 (설명 없이):
{
  "pages": [
    {
      "path": "페이지 경로 (원본 그대로)",
      "rootCause": "핵심 문제 원인 (1-2문장, 구체적 수치 포함)",
      "improvements": [
        "개선안 1: 콘텐츠/UX/SEO 중 해당 영역 명시 후 구체적 액션",
        "개선안 2",
        "개선안 3"
      ],
      "impact": "높음 또는 보통",
      "effort": "낮음 또는 보통 또는 높음",
      "expectedResult": "개선 후 예상 효과 (이탈률 X%p 감소 등 수치 포함)"
    }
  ],
  "summary": "전체 페이지 개선 방향 종합 의견 (2-3문장)"
}`;

  try {
    const { text } = await generateText(prompt);
    const parsed = extractJson(text);
    if (!parsed || !Array.isArray(parsed.pages)) {
      throw new Error('AI 응답 파싱 실패');
    }
    return NextResponse.json(parsed);
  } catch (e) {
    console.error('[GA4 pages]', e);
    return NextResponse.json({ error: 'AI 페이지 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
