import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isPlatformAdmin } from '@/lib/platform-admin';

/** 블로그 관리 API — 첫등원 운영자만. 이메일 또는 403 응답 */
export async function blogAdmin(): Promise<string | NextResponse> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !(await isPlatformAdmin(email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return email;
}
