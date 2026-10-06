import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ConsentType } from '@prisma/client';

type Params = Promise<{ slug: string }>;

async function revokeConsent(tenantId: string, leadId: string, type: ConsentType) {
  const existing = await prisma.consent.findFirst({
    where: { tenantId, leadId, type },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    await prisma.consent.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
  } else {
    await prisma.consent.create({ data: { tenantId, leadId, type, revokedAt: new Date() } });
  }
}

// GET /api/[slug]/unsubscribe?phone=010xxxx&type=marketing
// 카카오 광고성 메시지 수신 거부 링크 (SPEC §7 법적 요건)
export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const phone = url.searchParams.get('phone')?.trim();
  const rawType = url.searchParams.get('type') ?? 'marketing';
  const type = rawType === 'night' ? ConsentType.night : ConsentType.marketing;

  if (!phone) return NextResponse.redirect(new URL(`/${slug}`, req.url));

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const lead = await prisma.lead.findFirst({ where: { tenantId: tenant.id, phone } });
  if (lead) await revokeConsent(tenant.id, lead.id, type);

  return new NextResponse(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>수신 거부 완료</title></head>` +
    `<body style="font-family:sans-serif;text-align:center;padding:80px 20px">` +
    `<h1 style="font-size:24px">수신 거부가 완료됐습니다</h1>` +
    `<p style="color:#555;margin-top:16px">광고성 메시지 수신을 거부했습니다.<br>이후 해당 번호로 광고성 메시지가 발송되지 않습니다.</p>` +
    `<a href="/${slug}" style="display:inline-block;margin-top:32px;padding:12px 24px;background:#14213D;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">홈으로</a>` +
    `</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

// POST /api/[slug]/unsubscribe — programmatic opt-out
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const type = body.type === 'night' ? ConsentType.night : ConsentType.marketing;
  await revokeConsent(tenant.id, body.leadId, type);

  return NextResponse.json({ ok: true });
}
