import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';
import { AdminSide } from '@/components/admin/AdminSide';
import { NewTestForm } from './NewTestForm';

type Props = { params: Promise<{ slug: string }> };

export default async function TestsPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' }, select: { id: true, name: true } });
  if (!tenant) notFound();
  const membership = await getAdminMembership(tenant.id, session.user.email);
  if (!membership) redirect('/auth/signin');

  const [tests, questionCount] = await Promise.all([
    prisma.test.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ archived: 'asc' }, { createdAt: 'desc' }],
      include: {
        items: { select: { points: true } },
        attempts: { where: { tenantId: tenant.id }, select: { status: true, score: true, maxScore: true } },
      },
    }),
    prisma.question.count({ where: { tenantId: tenant.id, archived: false } }),
  ]);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="tests" />
      <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 960 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>레벨테스트 시험지</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
            시험지를 만들고, 상담 관리에서 학부모에게 응시 링크를 보내면 자동으로 채점됩니다.
          </div>
        </div>

        {questionCount === 0 && (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: '#FFF7E6', fontSize: 14 }}>
            먼저 <Link href={`/${slug}/admin/questions`} style={{ color: '#1E5645', fontWeight: 700 }}>문제은행</Link>에 문항을 넣어 주세요.
          </div>
        )}

        <NewTestForm slug={slug} />

        {tests.length === 0 ? (
          <div style={{ padding: 40, background: '#FFFFFF', borderRadius: 12, textAlign: 'center', color: '#9AA3AF' }}>아직 시험지가 없습니다.</div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#5A6270', background: '#FAF9F6' }}>
                  {['시험지', '학년', '문항', '총점', '응시', '평균'].map((h) => <th key={h} style={{ padding: '12px 16px', fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => {
                  const done = t.attempts.filter((a) => a.status === 'submitted' && a.maxScore);
                  const avg = done.length ? Math.round((done.reduce((s, a) => s + (a.score ?? 0) / (a.maxScore ?? 1), 0) / done.length) * 100) : null;
                  return (
                    <tr key={t.id} style={{ borderTop: '1px solid #EEEAE2', opacity: t.archived ? 0.5 : 1 }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        <Link href={`/${slug}/admin/tests/${t.id}`} style={{ color: '#1B2430' }}>{t.title}</Link>
                        {t.archived && <span style={{ marginLeft: 6, fontSize: 12, color: '#9AA3AF' }}>보관됨</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{t.grade ?? '–'}</td>
                      <td style={{ padding: '12px 16px' }}>{t.items.length}</td>
                      <td style={{ padding: '12px 16px' }}>{t.items.reduce((s, i) => s + i.points, 0)}</td>
                      <td style={{ padding: '12px 16px' }}>{done.length} / {t.attempts.length}</td>
                      <td style={{ padding: '12px 16px' }}>{avg === null ? '–' : `${avg}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
