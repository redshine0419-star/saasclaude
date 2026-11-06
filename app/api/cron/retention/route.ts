import { NextResponse } from 'next/server';
import { runRetention } from '@/lib/retention';

// Vercel Cron: 매일 18:00 UTC (KST 03:00) — 비공개 30일 지난 학원 파기, 만료된 직원 초대·5년 지난 결제 보관 기록 삭제
export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runRetention();
  console.log('[retention]', {
    purged: result.purged.map((p) => p.slug),
    failed: result.failed.length,
    expiredInvites: result.expiredInvites,
    expiredPaymentArchives: result.expiredPaymentArchives,
  });
  return NextResponse.json({ ok: true, ...result });
}
