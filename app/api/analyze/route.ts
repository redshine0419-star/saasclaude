import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.PAGESPEED_API_KEY;
  const strategies = ['mobile', 'desktop'] as const;

  try {
    const [mobileRes, desktopRes] = await Promise.all(
      strategies.map((strategy) => {
        const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
        endpoint.searchParams.set('url', url);
        endpoint.searchParams.set('strategy', strategy);
        endpoint.searchParams.append('category', 'PERFORMANCE');
        endpoint.searchParams.append('category', 'SEO');
        endpoint.searchParams.append('category', 'ACCESSIBILITY');
        endpoint.searchParams.append('category', 'BEST_PRACTICES');
        if (apiKey) endpoint.searchParams.set('key', apiKey);
        return fetch(endpoint.toString());
      })
    );

    if (!mobileRes.ok || !desktopRes.ok) {
      const errBody = await (mobileRes.ok ? desktopRes : mobileRes).json();
      return NextResponse.json(
        { error: errBody?.error?.message ?? 'PageSpeed API 호출 실패' },
        { status: 502 }
      );
    }

    const [mobile, desktop] = await Promise.all([mobileRes.json(), desktopRes.json()]);

    const extract = (data: Record<string, unknown>) => {
      const cats = data.lighthouseResult as Record<string, unknown>;
      const categories = cats?.categories as Record<string, { score: number }> | undefined;
      const audits = cats?.audits as Record<string, { score: number | null; displayValue?: string; numericValue?: number }> | undefined;

      return {
        scores: {
          performance: Math.round((categories?.performance?.score ?? 0) * 100),
          seo: Math.round((categories?.seo?.score ?? 0) * 100),
          accessibility: Math.round((categories?.accessibility?.score ?? 0) * 100),
          bestPractices: Math.round((categories?.['best-practices']?.score ?? 0) * 100),
        },
        vitals: {
          lcp: audits?.['largest-contentful-paint']?.displayValue ?? '-',
          fid: audits?.['max-potential-fid']?.displayValue ?? '-',
          cls: audits?.['cumulative-layout-shift']?.displayValue ?? '-',
          fcp: audits?.['first-contentful-paint']?.displayValue ?? '-',
          tbt: audits?.['total-blocking-time']?.displayValue ?? '-',
          si: audits?.['speed-index']?.displayValue ?? '-',
        },
        opportunities: Object.values(
          (cats?.audits as Record<string, { id: string; title: string; description: string; score: number | null; details?: { type: string } }>) ?? {}
        )
          .filter((a) => a.score !== null && a.score < 0.9 && a.details?.type === 'opportunity')
          .slice(0, 5)
          .map((a) => ({ id: a.id, title: a.title, description: a.description, score: a.score })),
      };
    };

    return NextResponse.json({
      mobile: extract(mobile as Record<string, unknown>),
      desktop: extract(desktop as Record<string, unknown>),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '서버 내부 오류' }, { status: 500 });
  }
}
