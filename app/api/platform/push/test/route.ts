import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isPlatformAdmin } from '@/lib/platform-admin';
import { pushToOperators } from '@/lib/push';

// POST — 내 기기로 운영 알림 테스트
export async function POST() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !(await isPlatformAdmin(email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const n = await pushToOperators({ title: '더클 운영 알림 테스트', body: '새 학원 개설·회원가입 알림을 이 기기에서 받습니다.', url: '/platform', tag: 'op-test' }, { email });
  if (n === 0) return NextResponse.json({ error: '보낼 기기가 없습니다. 먼저 이 기기에서 알림 받기를 켜 주세요.' }, { status: 404 });
  return NextResponse.json({ ok: true, sent: n });
}
