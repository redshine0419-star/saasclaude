import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

async function checkPlatformAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  const m = await prisma.membership.findFirst({
    where: { user: { email: session.user.email }, role: 'platform_admin' },
  });
  return !!m;
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  if (!(await checkPlatformAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const { theme, accentColor, status, sections } = body;

  await prisma.tenant.update({
    where: { id },
    data: {
      ...(theme && { theme }),
      ...(accentColor !== undefined && { accentColor: accentColor || null }),
      ...(status && { status }),
    },
  });

  if (Array.isArray(sections)) {
    await prisma.$transaction(
      sections.map((s: { key: string; enabled: boolean; sortOrder: number }) =>
        prisma.tenantSection.upsert({
          where: { tenantId_sectionKey: { tenantId: id, sectionKey: s.key } },
          update: { enabled: s.enabled, sortOrder: s.sortOrder },
          create: { tenantId: id, sectionKey: s.key, enabled: s.enabled, sortOrder: s.sortOrder },
        })
      )
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  if (!(await checkPlatformAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.tenant.update({ where: { id }, data: { status: 'inactive' } });
  return NextResponse.json({ ok: true });
}
