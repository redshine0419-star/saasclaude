import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { deviceLabel, pushConfigured } from '@/lib/push';

type Params = Promise<{ slug: string }>;
type Sub = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };

// POST — 이 기기에서 알림 받기 (원장·직원). 같은 기기면 덮어쓴다
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  if (!pushConfigured()) return NextResponse.json({ error: '앱 알림이 아직 준비되지 않았습니다. 첫등원 운영팀에 문의해 주세요.' }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { subscription?: Sub } | null;
  const s = body?.subscription;
  const endpoint = typeof s?.endpoint === 'string' ? s.endpoint : '';
  const p256dh = typeof s?.keys?.p256dh === 'string' ? s.keys.p256dh : '';
  const auth = typeof s?.keys?.auth === 'string' ? s.keys.auth : '';
  // 브라우저 푸시 서버 주소만 받는다
  if (!/^https:\/\/[a-z0-9.-]+\//i.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth) {
    return NextResponse.json({ error: '알림 구독 정보가 올바르지 않습니다.' }, { status: 400 });
  }
  const label = deviceLabel(req.headers.get('user-agent') ?? '');
  await prisma.pushDevice.upsert({
    where: { endpoint },
    create: { tenantId: a.tenantId, email: a.email, endpoint, p256dh, auth, label },
    update: { tenantId: a.tenantId, email: a.email, p256dh, auth, label },
  });
  return NextResponse.json({ ok: true });
}

// DELETE { endpoint } 또는 { id } — 알림 끄기. 자기 기기는 누구나, 다른 사람 기기는 원장만
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const body = (await req.json().catch(() => ({}))) as { endpoint?: unknown; id?: unknown };
  const where = typeof body.id === 'string' ? { id: body.id } : typeof body.endpoint === 'string' ? { endpoint: body.endpoint } : null;
  if (!where) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const d = await prisma.pushDevice.findFirst({ where: { ...where, tenantId: a.tenantId } });
  if (!d) return NextResponse.json({ ok: true });
  if (d.email !== a.email && !a.isOwner) return NextResponse.json({ error: '다른 사람의 기기는 원장만 끌 수 있습니다.' }, { status: 403 });
  await prisma.pushDevice.delete({ where: { id: d.id } });
  return NextResponse.json({ ok: true });
}
