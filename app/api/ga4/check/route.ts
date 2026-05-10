import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

async function safeFetch(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MarketerOps-Bot/1.0' },
    });
    clearTimeout(id);
    return res;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url?.trim()) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
  }

  const pageRes = await safeFetch(url);
  if (!pageRes || !pageRes.ok) {
    return NextResponse.json({ error: '페이지에 접근할 수 없습니다.' }, { status: 502 });
  }

  const html = await pageRes.text();
  const $ = cheerio.load(html);

  // GA4 측정 ID 패턴: G-XXXXXXXXXX
  const measurementIdRegex = /G-[A-Z0-9]{8,}/g;
  const allText = html;
  const measurementIds = [...new Set(allText.match(measurementIdRegex) ?? [])];

  // gtag.js 스크립트 존재 여부
  let gtagScriptFound = false;
  $('script').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const inline = $(el).html() ?? '';
    if (src.includes('gtag/js') || src.includes('googletagmanager') || inline.includes('gtag(')) {
      gtagScriptFound = true;
    }
  });

  // Google Tag Manager 확인
  const hasGTM = html.includes('googletagmanager.com/gtm.js') || html.includes('GTM-');
  const gtmIds = [...new Set((html.match(/GTM-[A-Z0-9]+/g) ?? []))];

  // dataLayer 확인
  const hasDataLayer = html.includes('dataLayer');

  const installed = measurementIds.length > 0 || gtagScriptFound;

  const issues: string[] = [];
  if (!installed) issues.push('GA4 태그가 감지되지 않습니다. Google Tag Manager 또는 gtag.js 직접 삽입이 필요합니다.');
  if (installed && !hasDataLayer) issues.push('dataLayer가 선언되지 않았습니다. 이벤트 추적이 제한될 수 있습니다.');
  if (measurementIds.length > 1) issues.push('GA4 측정 ID가 ' + measurementIds.length + '개 감지됐습니다. 중복 추적 여부를 확인하세요.');

  return NextResponse.json({
    installed,
    measurementIds,
    hasGTM,
    gtmIds,
    gtagScriptFound,
    hasDataLayer,
    issues,
  });
}
