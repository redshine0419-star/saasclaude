import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

async function checkPlatformAdmin() {
  const session = await auth();
  if (!session?.user?.email) return false;
  // 플랫폼 화면과 같은 기준: 환경변수 운영자 목록 또는 platform_admin 역할
  if ((process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).includes(session.user.email)) return true;
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

  const { theme, accentColor, status, published, sections, phone, address, hours, kakaoChannelUrl } = body;

  await prisma.tenant.update({
    where: { id },
    data: {
      ...(theme && { theme }),
      ...(accentColor !== undefined && { accentColor: accentColor || null }),
      // 운영 중지 시각을 남긴다 (자동 삭제 없음). 다시 운영하면 지운다
      ...(status === 'inactive' && tenant.status !== 'inactive' && { status, inactiveAt: new Date() }),
      ...(status === 'active' && { status, inactiveAt: null }),
      // 홈페이지 공개 여부 (원장 화면과 같은 칸)
      ...(published === true && { published: true, unpublishedAt: null }),
      ...(published === false && tenant.published && { published: false, unpublishedAt: new Date() }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(address !== undefined && { address: address || null }),
      ...(hours !== undefined && { hours: hours || null }),
      ...(kakaoChannelUrl !== undefined && { kakaoChannelUrl: kakaoChannelUrl || null }),
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

  await prisma.tenant.update({ where: { id }, data: { status: 'inactive', inactiveAt: new Date() } });
  return NextResponse.json({ ok: true });
}
