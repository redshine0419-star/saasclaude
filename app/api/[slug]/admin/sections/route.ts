import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const validThemes = ['warm', 'result', 'bright'];

  if (body.theme !== undefined) {
    if (!validThemes.includes(body.theme)) {
      return NextResponse.json({ error: '잘못된 테마입니다.' }, { status: 400 });
    }
    await prisma.tenant.update({ where: { id: tenant.id }, data: { theme: body.theme } });
  }

  if (Array.isArray(body.sections)) {
    for (const s of body.sections as { key: string; enabled: boolean; sortOrder: number }[]) {
      await prisma.tenantSection.upsert({
        where: { tenantId_sectionKey: { tenantId: tenant.id, sectionKey: s.key } },
        update: { enabled: s.enabled, sortOrder: s.sortOrder },
        create: { tenantId: tenant.id, sectionKey: s.key, enabled: s.enabled, sortOrder: s.sortOrder },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
