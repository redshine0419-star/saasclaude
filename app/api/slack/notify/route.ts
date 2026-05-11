import { NextRequest, NextResponse } from 'next/server';

export interface ScoreAlert {
  url: string;
  metric: string;
  previous: number;
  current: number;
  delta: number;
}

function formatAlert(alert: ScoreAlert): string {
  const dir = alert.delta > 0 ? '▲' : '▼';
  const emoji = alert.delta > 0 ? '🟢' : '🔴';
  return `${emoji} *${alert.metric}* ${dir}${Math.abs(alert.delta)}점\n  ${alert.previous} → ${alert.current}  (${alert.url})`;
}

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: 'SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다.' }, { status: 503 });
  }

  const { alerts, context }: { alerts: ScoreAlert[]; context?: string } = await req.json();

  if (!Array.isArray(alerts) || alerts.length === 0) {
    return NextResponse.json({ error: 'alerts 배열이 필요합니다.' }, { status: 400 });
  }

  const threshold = 10;
  const significant = alerts.filter((a) => Math.abs(a.delta) >= threshold);
  if (significant.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: `변화량 ${threshold}점 미만` });
  }

  const lines = [
    '*⚡ MarketerOps.ai 점수 변동 알림*',
    context ? `사이트: ${context}` : '',
    '',
    ...significant.map(formatAlert),
    '',
    `_${new Date().toLocaleString('ko-KR')}_`,
  ].filter((l) => l !== '');

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: lines.join('\n') }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Slack 전송 실패' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sent: significant.length });
}
