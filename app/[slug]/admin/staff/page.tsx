import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { StaffClient } from './StaffClient';

export default async function AdminStaffPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) redirect('/auth/signin');

  const staffList = await prisma.staffProfile.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="info" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>강사진 관리</h1>
        <div style={{ fontSize: 14, color: '#5A6270' }}>테마 B(성과 중심형) 홈페이지에 노출되는 강사 프로필입니다.</div>
        <StaffClient slug={slug} initialStaff={staffList.map((s) => ({
          id: s.id,
          name: s.name,
          roleLabel: s.roleLabel,
          photo: s.photo,
          summary: s.summary,
          sortOrder: s.sortOrder,
        }))} />
      </main>
    </div>
  );
}
