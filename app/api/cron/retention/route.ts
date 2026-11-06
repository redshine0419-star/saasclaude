import { NextResponse } from 'next/server';
import { runRetention } from '@/lib/retention';

// Vercel Cron: 매일 18:00 UTC (KST 03:00) — 만료된 직원 초대·5년 지난 결제 보관 기록 삭제 (학원은 자동 삭제하지 않음)
export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runRetention();
  console.log('[retention]', result);
  return NextResponse.json({ ok: true, ...result });
}
