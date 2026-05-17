import { NextRequest, NextResponse } from 'next/server';

const TRANSIENT_ERRORS = ['NO_FCP', 'NO_LCP', 'ERRORED_DOCUMENT_REQUEST', 'FAILED_DOCUMENT_REQUEST'];

async function fetchPageSpeed(url: string, strategy: 'mobile' | 'desktop', apiKey?: string): Promise<Record<string, unknown>> {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', strategy);
  endpoint.searchParams.append('category', 'PERFORMANCE');
  endpoint.searchParams.append('category', 'SEO');
  endpoint.searchParams.append('category', 'ACCESSIBILITY');
  endpoint.searchParams.append('category', 'BEST_PRACTICES');
  if (apiKey) endpoint.searchParams.set('key', apiKey);

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000 * attempt));

    const res = await fetch(endpoint.toString());

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message ?? `PageSpeed API 오류 (${res.status})`;
      if (attempt < 2) continue;
      throw new Error(msg);
    }

    const data = await res.json();
    const runtimeError = (data?.lighthouseResult as Record<string, unknown>)?.runtimeError as Record<string, string> | undefined;

    if (runtimeError?.code && TRANSIENT_ERRORS.includes(runtimeError.code)) {
      if (attempt < 2) continue;
      throw new Error(`페이지 분석 실패: 페이지가 응답하지 않았습니다. 잠시 후 다시 시도해 주세요. (${runtimeError.code})`);
    }

    if (!data?.lighthouseResult) {
      if (attempt < 2) continue;
      throw new Error('Lighthouse 결과를 받지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }

    return data as Record<string, unknown>;
  }

  throw new Error('분석 요청이 반복 실패했습니다. 잠시 후 다시 시도해 주세요.');
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.PAGESPEED_API_KEY;

  try {
    const [mobile, desktop] = await Promise.all([
      fetchPageSpeed(url, 'mobile', apiKey),
      fetchPageSpeed(url, 'desktop', apiKey),
    ]);

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
      mobile: extract(mobile),
      desktop: extract(desktop),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '서버 내부 오류';
    console.error('[analyze]', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
