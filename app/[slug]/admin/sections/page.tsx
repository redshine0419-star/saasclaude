import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { SectionsClient } from './SectionsClient';

type Props = { params: Promise<{ slug: string }> };

const ALL_SECTIONS = [
  { key: 'hero', themes: ['warm', 'result', 'bright'] },
  { key: 'quick_info', themes: ['warm'] },
  { key: 'director', themes: ['warm'] },
  { key: 'principles', themes: ['warm'] },
  { key: 'classes', themes: ['warm', 'bright'] },
  { key: 'timetable', themes: ['warm'] },
  { key: 'fees', themes: ['warm', 'result'] },
  { key: 'reviews', themes: ['warm', 'bright'] },
  { key: 'news', themes: ['warm'] },
  { key: 'results_stats', themes: ['result'] },
  { key: 'exam_system', themes: ['result'] },
  { key: 'curriculum', themes: ['result'] },
  { key: 'score_cases', themes: ['result'] },
  { key: 'teachers', themes: ['result'] },
  { key: 'day_flow', themes: ['bright'] },
  { key: 'gallery', themes: ['bright'] },
  { key: 'safety', themes: ['bright'] },
  { key: 'location', themes: ['warm'] },
  { key: 'consult_form', themes: ['warm', 'result', 'bright'] },
];

const SECTION_ORDERS: Record<string, string[]> = {
  warm: ['hero', 'quick_info', 'director', 'principles', 'classes', 'timetable', 'fees', 'reviews', 'news', 'consult_form', 'location'],
  result: ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'consult_form'],
  bright: ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'reviews', 'consult_form'],
};

export default async function AdminSectionsPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({
    where: { slug, status: 'active' },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!tenant) notFound();

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) redirect('/auth/signin');

  const theme = tenant.theme as 'warm' | 'result' | 'bright';
  const defaultOrder = SECTION_ORDERS[theme] ?? SECTION_ORDERS.warm;
  const themeSections = ALL_SECTIONS.filter((s) => s.themes.includes(theme));

  const existingMap = new Map(tenant.sections.map((s) => [s.sectionKey, s]));

  // Merge DB state with default order
  const sections = defaultOrder
    .filter((key) => themeSections.some((s) => s.key === key))
    .map((key, i) => {
      const existing = existingMap.get(key);
      return {
        key,
        label: key,
        enabled: existing ? existing.enabled : true,
        sortOrder: existing ? existing.sortOrder : i,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="sections" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionsClient slug={slug} theme={theme} sections={sections} />
      </main>
    </div>
  );
}
