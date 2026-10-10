import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { SectionsClient } from './SectionsClient';
import { DEFAULT_SECTION_ORDER, normalizeSections, type ThemeKey } from '@/lib/sections';

type Props = { params: Promise<{ slug: string }> };

export default async function AdminSectionsPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!tenant) notFound();

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) redirect('/auth/signin');

  const theme = tenant.theme as ThemeKey;
  const saved = tenant.sections.map((s) => ({ key: s.sectionKey, enabled: s.enabled }));
  const sections = normalizeSections(theme, saved.length > 0 ? saved : DEFAULT_SECTION_ORDER[theme].map((key) => ({ key, enabled: true })));

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="sections" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionsClient slug={slug} theme={theme} sections={sections} canEdit={membership.role === 'owner'} />
      </main>
    </div>
  );
}
