import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { ClassesClient } from './ClassesClient';

export default async function AdminClassesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await getAdminMembership(tenant.id, session.user.email!);
  if (!membership) redirect('/auth/signin');

  const [classes, levelTestSlots] = await Promise.all([
    prisma.classItem.findMany({
      where: { tenantId: tenant.id },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.levelTestSlot.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: [{ weekday: 'asc' }, { time: 'asc' }],
    }),
  ]);

  const serializedClasses = classes.map((c) => ({
    id: c.id,
    name: c.name,
    gradeBand: c.gradeBand,
    days: c.days,
    startTime: c.startTime,
    endTime: c.endTime,
    capacity: c.capacity,
    seatsLeft: c.seatsLeft,
    waitlistCount: c.waitlistCount,
    textbook: c.textbook,
    description: c.description,
  }));

  const serializedSlots = levelTestSlots.map((s) => ({
    id: s.id,
    weekday: s.weekday,
    time: s.time,
    active: s.active,
  }));

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        minHeight: '100vh',
        background: '#F4F2EE',
        color: '#1B2430',
        fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
      }}
    >
      <AdminSide slug={slug} tenantName={tenant.name} active="classes" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', gap: 20 }}>
        <ClassesClient slug={slug} classes={serializedClasses} levelTestSlots={serializedSlots} />
      </main>
    </div>
  );
}
