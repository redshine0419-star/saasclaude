import { NextResponse } from 'next/server';
import { runOwnerDigest } from '@/lib/messaging/owner-digest';

// Vercel Cron: 0 23 * * * — 매일 08:00 KST (Hobby 플랜은 그 시각부터 1시간 안에 실행)
// 아직 연락하지 않은(new) 상담을 학원별로 묶어 원장에게 한 번 알린다.
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const outcomes = await runOwnerDigest(new Date());
  if (outcomes.length > 0) console.log('[owner-digest]', outcomes);
  return NextResponse.json({ ok: true, tenants: outcomes.length });
}
