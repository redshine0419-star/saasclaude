import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.MEDIUM_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, reason: 'MEDIUM_TOKEN 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const res = await fetch('https://api.medium.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: 'Medium 토큰 인증 실패. 토큰을 확인하세요.' });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, username: data.data?.username });
  } catch {
    return NextResponse.json({ ok: false, reason: 'Medium API 연결 실패' });
  }
}
