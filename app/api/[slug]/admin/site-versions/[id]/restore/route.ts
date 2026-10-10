import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { accentError } from '@/lib/accent';
import { isThemeKey, normalizeSections } from '@/lib/sections';
import { applySiteConfig, recordSiteVersion, type SiteSnapshot } from '@/lib/site-versions';

type Params = Promise<{ slug: string; id: string }>;

export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug, id } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: '되돌리기는 원장만 할 수 있습니다.' }, { status: 403 });
  }

  const version = await prisma.siteVersion.findFirst({ where: { id, tenantId: tenant.id } });
  if (!version) return NextResponse.json({ error: '이력을 찾을 수 없습니다.' }, { status: 404 });

  // 저장 당시 규칙이 지금과 다를 수 있으므로 현재 규칙으로 다시 검증한다.
  const snap = version.snapshot as unknown as Partial<SiteSnapshot>;
  if (!isThemeKey(snap.theme) || !Array.isArray(snap.sections)) {
    return NextResponse.json({ error: '이 이력은 되돌릴 수 없습니다.' }, { status: 422 });
  }
  const accent = typeof snap.accentColor === 'string' && !accentError(snap.accentColor) ? snap.accentColor : null;
  const ordered = [...snap.sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const sections = normalizeSections(snap.theme, ordered.map((s) => ({ key: String(s.key), enabled: !!s.enabled })));

  await applySiteConfig(tenant.id, { theme: snap.theme, sections, accentColor: accent });
  await recordSiteVersion(tenant.id, session.user.email, 'restore');

  return NextResponse.json({ ok: true });
}
