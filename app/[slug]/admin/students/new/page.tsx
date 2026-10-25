import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { studentPageAuth } from '@/lib/students/page-auth';
import { kstToday } from '@/lib/format-date';
import { NewStudentForm } from './NewStudentForm';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lead?: string }> };

export default async function NewStudentPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { lead: leadId } = await searchParams;
  const { tenant } = await studentPageAuth(slug);

  const [classes, lead] = await Promise.all([
    prisma.classItem.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, gradeBand: true } }),
    leadId
      ? prisma.lead.findFirst({
          where: { id: leadId, tenantId: tenant.id },
          select: { id: true, parentName: true, phone: true, studentGrade: true, school: true, student: { select: { id: true } } },
        })
      : null,
  ]);
  // 이미 원생으로 등록된 상담이면 그 학생부로
  if (lead?.student) redirect(`/${slug}/admin/students/${lead.student.id}`);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="students" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
        <Link href={`/${slug}/admin/students`} style={{ fontSize: 14, color: '#5A6270', textDecoration: 'none' }}>← 학생부</Link>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>학생 추가</h1>
        {lead && (
          <div style={{ padding: '12px 14px', borderRadius: 10, background: '#E4EEE9', fontSize: 14, lineHeight: 1.6 }}>
            상담 기록에서 학부모 정보와 학년을 가져왔습니다. 상담 이력과 레벨테스트 결과가 학생부에 함께 연결됩니다.
          </div>
        )}
        <NewStudentForm
          slug={slug}
          classes={classes}
          today={kstToday()}
          leadId={lead?.id ?? null}
          initial={{ parentName: lead?.parentName ?? '', parentPhone: lead?.phone ?? '', grade: lead?.studentGrade ?? '', school: lead?.school ?? '' }}
        />
      </main>
    </div>
  );
}
