import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${APP_URL}/api/work/ai-pm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-source': 'internal',
    },
  });

  const data = await res.json();
  return NextResponse.json({ ok: res.ok, result: data });
}
