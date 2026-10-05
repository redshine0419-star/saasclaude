import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';

const CATEGORY_LABEL: Record<string, string> = {
  notice: '공지',
  recruit: '모집',
  exam: '시험 대비',
};

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: '게시 중', bg: '#D8E8E0', color: '#1E5645' },
  scheduled: { label: '예약됨', bg: '#FBF1CF', color: '#5A4A12' },
  draft: { label: '임시저장', bg: '#E6E9EE', color: '#2C3747' },
};

function formatKST(date: Date) {
  const kst = new Date(date.getTime() + 9 * 3600 * 1000);
  return `${kst.getUTCMonth() + 1}.${String(kst.getUTCDate()).padStart(2, '0')}`;
}

export default async function AdminNewsPage({
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

  const posts = await prisma.post.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const lastPublished = posts.find((p) => p.status === 'published');
  const daysSinceLast = lastPublished
    ? Math.floor((Date.now() - lastPublished.publishedAt!.getTime()) / 86400000)
    : null;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh' }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="news" />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          background: '#F4F2EE',
          color: '#1B2430',
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>소식</h1>
          <Link
            href={`/${slug}/admin/news/edit`}
            style={{
              height: 44,
              padding: '0 18px',
              borderRadius: 8,
              background: '#1E5645',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            새 글 쓰기
          </Link>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
          {posts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>
              아직 작성한 소식이 없습니다.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#5A6270', background: '#FAF9F6' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>구분</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>제목</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>게시일</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>카톡 발송</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>상태</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const badge = STATUS_BADGE[post.status] ?? STATUS_BADGE.draft;
                  return (
                    <tr key={post.id} style={{ borderTop: '1px solid #EEEAE2' }}>
                      <td style={{ padding: '16px' }}>
                        {CATEGORY_LABEL[post.category] ?? post.category}
                      </td>
                      <td style={{ padding: 16, fontWeight: 600 }}>{post.title}</td>
                      <td style={{ padding: 16 }}>
                        {post.publishedAt ? formatKST(post.publishedAt) : '–'}
                      </td>
                      <td style={{ padding: 16 }}>
                        {post.sendKakao ? (
                          post.kakaoScheduledAt ? (
                            <span style={{ color: '#5A4A12' }}>
                              예약 {formatKST(post.kakaoScheduledAt)}
                            </span>
                          ) : (
                            '발송됨'
                          )
                        ) : (
                          '–'
                        )}
                      </td>
                      <td style={{ padding: 16 }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 5,
                            background: badge.bg,
                            color: badge.color,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>
                        <Link
                          href={`/${slug}/admin/news/edit?id=${post.id}`}
                          style={{ fontSize: 13, color: '#1E5645', textDecoration: 'none' }}
                        >
                          편집
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Writing cadence nudge */}
        <div
          style={{
            padding: '20px 24px',
            background: '#FFFFFF',
            borderRadius: 12,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.7, color: '#3E4652' }}>
            {daysSinceLast !== null ? (
              <>
                <b style={{ color: '#1B2430' }}>마지막 글이 {daysSinceLast}일 전입니다.</b>{' '}
                꾸준히 새 글이 올라오는 편이 검색 노출에 유리합니다. 목표: 한 달 2~3개.
              </>
            ) : (
              <>
                <b style={{ color: '#1B2430' }}>아직 게시된 글이 없습니다.</b>{' '}
                꾸준히 새 글이 올라오는 편이 검색 노출에 유리합니다.
              </>
            )}
          </div>
          <Link
            href={`/${slug}/admin/news/edit`}
            style={{ fontSize: 14, fontWeight: 600, color: '#1E5645', textDecoration: 'none' }}
          >
            글 쓰기
          </Link>
        </div>
      </main>
    </div>
  );
}
