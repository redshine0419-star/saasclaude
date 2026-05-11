import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

function extractContext(text: string, name: string): { mentioned: boolean; context: string } {
  const lower = text.toLowerCase();
  const nameLower = name.toLowerCase();
  const idx = lower.indexOf(nameLower);
  if (idx === -1) return { mentioned: false, context: '' };
  const start = Math.max(0, idx - 90);
  const end = Math.min(text.length, idx + name.length + 90);
  const context = (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
  return { mentioned: true, context };
}

export async function POST(req: NextRequest) {
  const { company, industry, competitors = [], prompts } = await req.json();

  if (!company?.trim()) return NextResponse.json({ error: '회사명을 입력해주세요.' }, { status: 400 });
  if (!prompts?.length) return NextResponse.json({ error: '프롬프트를 최소 1개 입력해주세요.' }, { status: 400 });

  const limitedPrompts = (prompts as string[]).slice(0, 6);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const promptResults = await Promise.all(
    limitedPrompts.map(async (prompt: string) => {
      try {
        const res = await model.generateContent(
          '당신은 사용자 질문에 자연스럽고 포괄적으로 답하는 AI 어시스턴트입니다. ' +
          '특정 브랜드를 편향 없이 있는 그대로 답변하세요. 한국어로 답변하세요.\n\n질문: ' + prompt
        );
        const response = res.response.text();
        const companyResult = extractContext(response, company);
        const competitorMentions = (competitors as string[]).map((c: string) => ({
          name: c,
          ...extractContext(response, c),
        }));
        return {
          prompt,
          mentioned: companyResult.mentioned,
          context: companyResult.context,
          aiResponse: response.slice(0, 400),
          competitorMentions,
        };
      } catch {
        return {
          prompt,
          mentioned: false,
          context: '',
          aiResponse: '',
          competitorMentions: (competitors as string[]).map((c: string) => ({ name: c, mentioned: false, context: '' })),
        };
      }
    })
  );

  const mentionCount = promptResults.filter(r => r.mentioned).length;
  const mentionRate = Math.round((mentionCount / limitedPrompts.length) * 100);

  const competitorSummary = (competitors as string[]).map((c: string) => {
    const count = promptResults.filter(r => r.competitorMentions.find(cm => cm.name === c && cm.mentioned)).length;
    return { name: c, mentionCount: count, mentionRate: Math.round((count / limitedPrompts.length) * 100) };
  });

  const mentionedPrompts = promptResults.filter(r => r.mentioned).map(r => r.prompt);
  const notMentionedPrompts = promptResults.filter(r => !r.mentioned).map(r => r.prompt);

  const insightPrompt =
    '다음은 AI 모델이 사용자 질문에 응답할 때 "' + company + '" 브랜드의 AI 언급율 측정 결과입니다.\n\n' +
    '업종: ' + industry + '\n' +
    'AI 언급율: ' + mentionRate + '% (' + mentionCount + '/' + limitedPrompts.length + '개 프롬프트)\n' +
    (mentionedPrompts.length ? '언급된 질문: ' + mentionedPrompts.join(' / ') + '\n' : '') +
    (notMentionedPrompts.length ? '언급 안된 질문: ' + notMentionedPrompts.join(' / ') + '\n' : '') +
    (competitorSummary.length ? '경쟁사 언급율: ' + competitorSummary.map(c => c.name + ' ' + c.mentionRate + '%').join(', ') + '\n' : '') +
    '\nAI 가시성(GEO) 관점에서 핵심 인사이트 3가지와 실행 가능한 개선 방향을 한국어로 작성하세요. 마크다운 없이 300자 이내로 간결하게.';

  let insights = '';
  try {
    const insightRes = await model.generateContent(insightPrompt);
    insights = insightRes.response.text();
  } catch {}

  return NextResponse.json({
    company,
    industry,
    mentionRate,
    mentionCount,
    totalPrompts: limitedPrompts.length,
    results: promptResults,
    competitorSummary,
    insights,
  });
}
