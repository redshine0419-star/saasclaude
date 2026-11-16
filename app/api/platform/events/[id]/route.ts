import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isPlatformAdmin } from '@/lib/platform-admin';
import { approveClaim, rejectClaim } from '@/lib/events/apply';

type Params = Promise<{ id: string }>;

// PATCH /api/platform/events/[id] — 운영자 승인·반려 { action: 'approve' } | { action: 'reject', reason }
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { action?: string; reason?: string } | null;
  if (body?.action === 'approve') {
    const r = await approveClaim(id, email);
    return r.ok ? NextResponse.json({ ok: true, target: r.target, until: r.until.toISOString() }) : NextResponse.json({ error: r.error }, { status: 409 });
  }
  if (body?.action === 'reject') {
    const reason = (body.reason ?? '').trim().slice(0, 300);
    if (!reason) return NextResponse.json({ error: '반려 사유를 적어 주세요.' }, { status: 400 });
    const r = await rejectClaim(id, email, reason);
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 409 });
  }
  return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
}
