import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { ReportClient } from './ReportClient';

type Props = { params: Promise<{ slug: string }> };

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-');
  return `${year}년 ${parseInt(month)}월`;
}

function prevMonths(currentYm: string, count: number): string[] {
  const [y, m] = currentYm.split('-').map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    let mo = m - i;
    let yr = y;
    while (mo <= 0) { mo += 12; yr -= 1; }
    months.push(`${yr}-${String(mo).padStart(2, '0')}`);
  }
  return months;
}

export default async function AdminReportPage({ params }: Props) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) redirect('/auth/signin');

  // Current month
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const months = prevMonths(month, 6);

  // 6-month lead counts
  const allLeads = await prisma.lead.findMany({
    where: {
      tenantId: tenant.id,
      createdAt: { gte: new Date(`${months[0]}-01`) },
    },
    select: { createdAt: true, status: true, source: true },
  });

  const history = months.map((ym) => {
    const [y, m] = ym.split('-').map(Number);
    const monthLeads = allLeads.filter((l) => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
    return {
      month: ym,
      label: `${parseInt(m.toString())}월`,
      leads: monthLeads.length,
      enrolled: monthLeads.filter((l) => l.status === 'enrolled').length,
    };
  });

  // Keywords from source field
  const sourceMap: Record<string, number> = {};
  allLeads.forEach((l) => {
    if (l.source) {
      const key = l.source.trim();
      sourceMap[key] = (sourceMap[key] ?? 0) + 1;
    }
  });
  const keywords = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([keyword, count]) => ({ keyword, count }));

  // Message sent count for current month
  const monthStart = new Date(`${month}-01`);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const messageSentCount = await prisma.message.count({
    where: {
      tenantId: tenant.id,
      createdAt: { gte: monthStart, lt: monthEnd },
    },
  });

  // MonthlyReport for current month
  const report = await prisma.monthlyReport.findUnique({
    where: { tenantId_month: { tenantId: tenant.id, month } },
  });

  const aiCheck = (report?.aiCheck ?? null) as {
    query: string;
    engines: { name: string; mentioned: boolean; source: string }[];
  } | null;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <div data-print-hide><AdminSide slug={slug} tenantName={tenant.name} active="report" /></div>
      <main data-print-root style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ReportClient
          slug={slug}
          month={month}
          monthLabel={formatMonthLabel(month)}
          history={history}
          keywords={keywords}
          aiCheck={aiCheck}
          managerNote={report?.managerNote ?? null}
          messageSentCount={messageSentCount}
        />
      </main>
    </div>
  );
}
