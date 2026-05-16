import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';

async function diagnoseUrl(url: string) {
  const base = APP_URL;

  const [analyzeRes, geoRes] = await Promise.all([
    fetch(base + '/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }),
    fetch(base + '/api/geo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }),
  ]);

  if (!analyzeRes.ok || !geoRes.ok) throw new Error('진단 API 오류: ' + url);

  const analyze = await analyzeRes.json();
  const geo = await geoRes.json();
  return { url, analyze, geo };
}

async function buildReport(results: Awaited<ReturnType<typeof diagnoseUrl>>[]) {
  const summaries = results.map((r) =>
    '- ' + r.url + ': Performance ' + r.analyze.mobile.scores.performance +
    ', SEO ' + r.analyze.mobile.scores.seo +
    ', GEO ' + r.geo.score
  ).join('\n');

  const prompt = '다음은 마케팅 도구 GrowWeb.me의 주간 자동 진단 결과입니다.\n\n' +
    summaries + '\n\n' +
    '각 사이트의 주요 변화와 즉시 취할 수 있는 개선 액션을 3문장 이내로 요약하세요. 한국어로.';

  const { text } = await generateText(prompt);
  return text;
}

async function sendSlack(message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== 'Bearer ' + CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urlsEnv = process.env.CRON_WATCH_URLS ?? '';
  const urls = urlsEnv.split(',').map((u) => u.trim()).filter(Boolean);

  if (urls.length === 0) {
    return NextResponse.json({ message: 'CRON_WATCH_URLS 환경변수에 URL을 설정하세요.' });
  }

  const results: Awaited<ReturnType<typeof diagnoseUrl>>[] = [];
  const errors: string[] = [];

  for (const url of urls) {
    try {
      results.push(await diagnoseUrl(url));
    } catch (e) {
      errors.push(url + ': ' + (e instanceof Error ? e.message : '오류'));
    }
  }

  if (results.length === 0) {
    return NextResponse.json({ message: '진단 결과 없음', errors });
  }

  const report = await buildReport(results);

  const lines = [
    '*📊 GrowWeb.me 주간 자동 진단 리포트*',
    '날짜: ' + new Date().toLocaleDateString('ko-KR'),
    '',
    '*진단 요약*',
    report,
    '',
    '*세부 점수*',
    ...results.map((r) =>
      '• ' + r.url + '\n  Performance ' + r.analyze.mobile.scores.performance +
      ' | SEO ' + r.analyze.mobile.scores.seo +
      ' | GEO ' + r.geo.score
    ),
    ...(errors.length ? ['', '*오류*', ...errors.map((e) => '• ' + e)] : []),
  ];

  await sendSlack(lines.join('\n'));

  return NextResponse.json({ ok: true, diagnosed: results.length, report });
}
