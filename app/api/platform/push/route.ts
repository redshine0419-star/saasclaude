import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isPlatformAdmin } from '@/lib/platform-admin';
import { deviceLabel, pushConfigured } from '@/lib/push';

type Sub = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };

async function operator() {
  const session = await auth();
  const email = session?.user?.email;
  return email && (await isPlatformAdmin(email)) ? email : null;
}

// POST — 이 기기에서 운영 알림 받기 (운영자만)
export async function POST(req: NextRequest) {
  const email = await operator();
  if (!email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!pushConfigured()) return NextResponse.json({ error: '앱 알림 키(VAPID)가 아직 설정되지 않았습니다.' }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { subscription?: Sub } | null;
  const s = body?.subscription;
  const endpoint = typeof s?.endpoint === 'string' ? s.endpoint : '';
  const p256dh = typeof s?.keys?.p256dh === 'string' ? s.keys.p256dh : '';
  const authKey = typeof s?.keys?.auth === 'string' ? s.keys.auth : '';
  if (!/^https:\/\/[a-z0-9.-]+\//i.test(endpoint) || endpoint.length > 1000 || !p256dh || !authKey) {
    return NextResponse.json({ error: '알림 구독 정보가 올바르지 않습니다.' }, { status: 400 });
  }
  const label = deviceLabel(req.headers.get('user-agent') ?? '');
  await prisma.operatorPushDevice.upsert({
    where: { endpoint },
    create: { email, endpoint, p256dh, auth: authKey, label },
    update: { email, p256dh, auth: authKey, label },
  });
  return NextResponse.json({ ok: true });
}

// DELETE { endpoint } 또는 { id } — 알림 끄기 (운영자만)
export async function DELETE(req: NextRequest) {
  const email = await operator();
  if (!email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { endpoint?: unknown; id?: unknown };
  const where = typeof body.id === 'string' ? { id: body.id } : typeof body.endpoint === 'string' ? { endpoint: body.endpoint } : null;
  if (!where) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  await prisma.operatorPushDevice.deleteMany({ where });
  return NextResponse.json({ ok: true });
}
