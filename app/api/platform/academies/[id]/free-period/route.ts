import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isPlatformAdmin } from '@/lib/platform-admin';
import { grantFreeMonths } from '@/lib/events/apply';

type Params = Promise<{ id: string }>;

// POST /api/platform/academies/[id]/free-period — 운영자가 학원에 무료 기간을 직접 추가 { months, reason, notify }
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { months?: unknown; reason?: unknown; notify?: unknown } | null;
  const r = await grantFreeMonths(id, Number(body?.months), typeof body?.reason === 'string' ? body.reason : '', email, { notify: body?.notify !== false });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, target: r.target, until: r.until.toISOString() });
}
