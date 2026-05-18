import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getValidGSCToken } from '@/lib/gsc-tokens';
import { generateText } from '@/lib/ai';

interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface OpportunityItem {
  type: 'near-miss' | 'ctr-fix' | 'quick-win';
  query: string;
  currentPosition: number;
  impressions: number;
  currentCtr: number;
  currentClicks: number;
  potentialClicks: number;
  upliftClicks: number;
  aiAction: string;
}

async function queryGSC(accessToken: string, siteUrl: string, body: object): Promise<GSCRow[]> {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `GSC API 오류 (${res.status})`);
  return (data.rows ?? []) as GSCRow[];
}

export async function POST(req: NextRequest) {
  const { siteUrl, startDate, endDate } = await req.json();

  if (!siteUrl?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: 'siteUrl, startDate, endDate가 필요합니다.' }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const accessToken = await getValidGSCToken(session.user.email);
  if (!accessToken) return NextResponse.json({ error: 'Search Console 연결이 필요합니다.' }, { status: 401 });

  try {
    const rows = await queryGSC(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 200,
    });

    const queries = rows.map((r) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: Math.round(r.position * 10) / 10,
    }));

    const avgCtr = queries.reduce((s, q) => s + q.ctr * q.impressions, 0) /
      Math.max(queries.reduce((s, q) => s + q.impressions, 0), 1);

    // 1순위: Near-Miss (4~10위, 노출 30+) — 소폭 최적화로 1페이지 진입 가능
    const nearMiss = queries
      .filter((q) => q.position >= 4 && q.position <= 10 && q.impressions >= 30)
      .map((q) => {
        // 3위 도달 시 예상 CTR 10%, 1위 도달 시 30%
        const targetCtr = q.position <= 7 ? 0.10 : 0.06;
        const potentialClicks = Math.round(q.impressions * targetCtr);
        return { ...q, potentialClicks, upliftClicks: Math.max(0, potentialClicks - q.clicks) };
      })
      .sort((a, b) => b.upliftClicks - a.upliftClicks)
      .slice(0, 8);

    // 2순위: CTR Fix (CTR이 사이트 평균의 40% 미만, 노출 50+) — 타이틀/메타 개선
    const ctrFix = queries
      .filter((q) => q.impressions >= 50 && q.ctr < avgCtr * 0.4 && q.position <= 15
        && !nearMiss.some((n) => n.query === q.query))
      .map((q) => {
        const targetCtr = avgCtr * 0.8;
        const potentialClicks = Math.round(q.impressions * targetCtr);
        return { ...q, potentialClicks, upliftClicks: Math.max(0, potentialClicks - q.clicks) };
      })
      .sort((a, b) => b.upliftClicks - a.upliftClicks)
      .slice(0, 6);

    // 3순위: Quick Win (11~20위, 노출 50+) — 콘텐츠 보강으로 2페이지 → 1페이지
    const quickWin = queries
      .filter((q) => q.position > 10 && q.position <= 20 && q.impressions >= 50
        && !nearMiss.some((n) => n.query === q.query)
        && !ctrFix.some((c) => c.query === q.query))
      .map((q) => {
        const potentialClicks = Math.round(q.impressions * 0.05);
        return { ...q, potentialClicks, upliftClicks: Math.max(0, potentialClicks - q.clicks) };
      })
      .sort((a, b) => b.upliftClicks - a.upliftClicks)
      .slice(0, 5);

    // AI 액션 생성: 상위 12개 기회에 대해
    const topOpps = [
      ...nearMiss.slice(0, 5).map((q) => ({ ...q, type: 'near-miss' as const })),
      ...ctrFix.slice(0, 4).map((q) => ({ ...q, type: 'ctr-fix' as const })),
      ...quickWin.slice(0, 3).map((q) => ({ ...q, type: 'quick-win' as const })),
    ];

    const prompt = `당신은 SEO 전문가입니다. 아래는 Google Search Console에서 가져온 키워드 기회 목록입니다.
각 키워드에 대해 구체적이고 즉시 실행 가능한 액션 1~2문장을 한국어로 작성하세요.
타이틀 태그와 메타 설명 개선, 콘텐츠 보강, 내부 링크 추가 등 실무적 조언을 포함하세요.

키워드 목록:
${topOpps.map((q, i) => `${i + 1}. [${q.type === 'near-miss' ? '순위향상' : q.type === 'ctr-fix' ? 'CTR개선' : '퀵윈'}] "${q.query}" — 현재 ${q.position}위, 월 ${q.impressions}회 노출, CTR ${(q.ctr * 100).toFixed(1)}%`).join('\n')}

응답 형식 (JSON 배열, 다른 텍스트 없이):
["액션1", "액션2", "액션3", ...]`;

    let actions: string[] = topOpps.map(() => '');
    try {
      const { text } = await generateText(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as string[];
        actions = parsed.map((a) => String(a ?? ''));
      }
    } catch {
      // AI 실패 시 기본 메시지
      actions = topOpps.map((q) =>
        q.type === 'near-miss'
          ? `타이틀 앞부분에 "${q.query}" 키워드를 배치하고, 메타 설명에 클릭 유도 문구를 추가하세요.`
          : q.type === 'ctr-fix'
          ? `"${q.query}"를 포함한 매력적인 타이틀과 검색 의도에 맞는 메타 설명(150자)으로 재작성하세요.`
          : `"${q.query}" 관련 콘텐츠를 1,000자 이상 보강하고 내부 링크 3개 이상을 추가하세요.`
      );
    }

    const opportunities: OpportunityItem[] = topOpps.map((q, i) => ({
      type: q.type,
      query: q.query,
      currentPosition: q.position,
      impressions: q.impressions,
      currentCtr: q.ctr,
      currentClicks: q.clicks,
      potentialClicks: q.potentialClicks,
      upliftClicks: q.upliftClicks,
      aiAction: actions[i] ?? '',
    }));

    const totalUplift = opportunities.reduce((s, o) => s + o.upliftClicks, 0);

    return NextResponse.json({
      opportunities,
      totalUplift,
      period: { startDate, endDate },
      analysisDate: new Date().toISOString().slice(0, 10),
    });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[GSC opportunities]', msg);
    return NextResponse.json({ error: 'GSC 오류: ' + msg }, { status: 500 });
  }
}
