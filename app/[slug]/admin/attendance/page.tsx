import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { studentPageAuth } from '@/lib/students/page-auth';
import { parseDateOnly } from '@/lib/students/input';
import { kstToday } from '@/lib/format-date';
import { AttendanceClient } from './AttendanceClient';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string; classId?: string }> };

export default async function AttendancePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { tenant } = await studentPageAuth(slug);

  const today = kstToday();
  const dateStr = parseDateOnly(sp.date) ? sp.date! : today;
  const date = parseDateOnly(dateStr)!;
  const classId = sp.classId ?? '';

  const [classes, students] = await Promise.all([
    prisma.classItem.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, days: true } }),
    prisma.student.findMany({
      where: { tenantId: tenant.id, status: 'active', ...(classId === 'none' ? { classId: null } : classId ? { classId } : {}) },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, grade: true, class: { select: { name: true } }, attendances: { where: { tenantId: tenant.id, date }, select: { status: true, note: true } } },
    }),
  ]);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="attendance" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>출결</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>재원생의 출석·지각·결석을 기록합니다. 기록은 학생부에 모이며, 학부모에게 자동으로 알리지는 않습니다.</div>
        </div>
        <AttendanceClient
          key={`${dateStr}-${classId}`}
          slug={slug}
          date={dateStr}
          today={today}
          classId={classId}
          classes={classes.map((c) => ({ id: c.id, name: c.name, days: c.days }))}
          students={students.map((s) => ({ id: s.id, name: s.name, grade: s.grade, className: s.class?.name ?? null, status: s.attendances[0]?.status ?? null, note: s.attendances[0]?.note ?? '' }))}
        />
      </main>
    </div>
  );
}
