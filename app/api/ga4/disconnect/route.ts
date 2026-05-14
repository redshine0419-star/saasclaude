import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { deleteTokens } from '@/lib/ga4-tokens';

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await deleteTokens(session.user.email);
  return NextResponse.json({ ok: true });
}
