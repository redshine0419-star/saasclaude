import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { isThemeKey, normalizeSections, type SectionInput, type ThemeKey } from '@/lib/sections';
import { applySiteConfig, ensureBaselineVersion, recordSiteVersion } from '@/lib/site-versions';

type Params = Promise<{ slug: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: '홈페이지 구성은 원장만 바꿀 수 있습니다.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  if (body.theme !== undefined && !isThemeKey(body.theme)) {
    return NextResponse.json({ error: '잘못된 테마입니다.' }, { status: 400 });
  }
  const theme: ThemeKey = isThemeKey(body.theme) ? body.theme : (tenant.theme as ThemeKey);

  const input: SectionInput[] = Array.isArray(body.sections)
    ? (body.sections as unknown[])
        .filter((s): s is SectionInput => !!s && typeof (s as SectionInput).key === 'string')
        .map((s) => ({ key: s.key, enabled: !!s.enabled }))
    : (await prisma.tenantSection.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: 'asc' } }))
        .map((s) => ({ key: s.sectionKey, enabled: s.enabled }));

  const sections = normalizeSections(theme, input);

  await ensureBaselineVersion(tenant.id, session.user.email);
  await applySiteConfig(tenant.id, { theme, sections });
  await recordSiteVersion(tenant.id, session.user.email, 'sections');

  return NextResponse.json({ ok: true, theme, sections });
}
