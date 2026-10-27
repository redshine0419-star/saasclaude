import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { adminSession } from '@/lib/demo-viewer';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { formatKstDateTime } from '@/lib/format-date';
import { ERROR_SUBJECTS, errorSubjectOf, readErrorTypeConfig, type ErrorSubject } from '@/lib/level-test/error-types';
import { ErrorTypesEditor } from './ErrorTypesEditor';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ types?: string }> };

function maskName(name: string) {
  return name ? `${name[0]}${'○'.repeat(Math.max(1, name.length - 1))}` : '';
}

export default async function GradingInboxPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { types } = await searchParams;
  const session = await adminSession(slug);
  if (!session?.user?.email) redirect('/auth/signin');
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true, subjects: true, errorTypes: true } });
  if (!tenant) notFound();
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) redirect('/auth/signin');

  const include = {
    test: { select: { title: true, items: { select: { question: { select: { type: true } } } } } },
    lead: { select: { parentName: true, studentGrade: true } },
    responses: { select: { points: true, question: { select: { type: true } } } },
  } as const;
  const [pending, recent] = await Promise.all([
    prisma.testAttempt.findMany({ where: { tenantId: tenant.id, status: 'submitted', needsGrading: true }, orderBy: { submittedAt: 'asc' }, include }),
    prisma.testAttempt.findMany({
      where: { tenantId: tenant.id, status: 'submitted', needsGrading: false, gradedAt: { not: null } },
      orderBy: { gradedAt: 'desc' }, take: 20, include,
    }),
  ]);

  // 오답 유형 설정에 보일 과목: 학원 교습과목 + 문제은행에 있는 과목 (없으면 전체)
  const qSubjects = await prisma.question.findMany({ where: { tenantId: tenant.id }, distinct: ['subject'], select: { subject: true } });
  const used = new Set<ErrorSubject>([...(tenant.subjects ?? '').split(/[,·\s/]+/).filter(Boolean), ...qSubjects.map((q) => q.subject)].map(errorSubjectOf));
  const editorSubjects = ERROR_SUBJECTS.filter((s) => used.has(s));

  const row = (a: (typeof pending)[number], done: boolean) => {
    const essays = a.test.items.filter((i) => i.question.type === 'essay').length;
    const graded = a.responses.filter((r) => r.question.type === 'essay' && r.points !== null).length;
    return (
      <tr key={a.id} style={{ borderTop: '1px solid #EEEAE2' }}>
        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{a.test.title}</td>
        <td style={{ padding: '12px 16px' }}>{a.lead ? `${maskName(a.lead.parentName)} · ${a.lead.studentGrade ?? '학년 미기재'}` : '–'}</td>
        <td style={{ padding: '12px 16px' }}>{a.submittedAt ? formatKstDateTime(a.submittedAt) : '–'}</td>
        <td style={{ padding: '12px 16px' }}>{done ? `${a.score}/${a.maxScore}점` : `서술형 ${graded}/${essays} 채점`}</td>
        <td style={{ padding: '12px 16px' }}>
          <Link href={`/${slug}/admin/grading/${a.id}`} style={{ color: '#1E5645', fontWeight: 600 }}>{done ? '다시 보기' : '채점하기 →'}</Link>
        </td>
      </tr>
    );
  };
  const head = (
    <thead><tr style={{ textAlign: 'left', color: '#5A6270', background: '#FAF9F6' }}>{['시험지', '학부모·학년', '제출', '진행', ''].map((h) => <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
  );

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="grading" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>채점함</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>서술형 문항이 있는 레벨테스트는 여기서 점수와 첨삭을 남기면 결과지에 반영됩니다.</div>
        </div>
        <section style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px', fontWeight: 700 }}>채점 대기 {pending.length}건</div>
          {pending.length === 0 ? (
            <div style={{ padding: '24px 20px', color: '#9AA3AF' }}>채점할 응시가 없습니다.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>{head}<tbody>{pending.map((a) => row(a, false))}</tbody></table>
          )}
        </section>
        <ErrorTypesEditor
          slug={slug}
          subjects={editorSubjects.length ? editorSubjects : [...ERROR_SUBJECTS]}
          initial={readErrorTypeConfig(tenant.errorTypes)}
          canEdit={membership.role === 'owner'}
          open={types === '1'}
        />
        {recent.length > 0 && (
          <section style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 8px', fontWeight: 700 }}>최근 채점 완료</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>{head}<tbody>{recent.map((a) => row(a, true))}</tbody></table>
          </section>
        )}
      </main>
    </div>
  );
}
