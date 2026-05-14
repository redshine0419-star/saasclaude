import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { deleteGSCTokens } from '@/lib/gsc-tokens';

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteGSCTokens(session.user.email);
  return NextResponse.json({ ok: true });
}
