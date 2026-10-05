import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { NewsEditClient } from './NewsEditClient';

export default async function AdminNewsEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { slug } = await params;
  const { id } = await searchParams;

  const session = await auth();
  if (!session?.user?.email) redirect('/auth/signin');

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) notFound();

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) redirect('/auth/signin');

  let post = undefined;
  if (id) {
    const found = await prisma.post.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!found) notFound();
    post = {
      id: found.id,
      title: found.title,
      body: found.body,
      category: found.category,
      status: found.status,
      sendKakao: found.sendKakao,
      kakaoScheduledAt: found.kakaoScheduledAt?.toISOString() ?? null,
      publishedAt: found.publishedAt?.toISOString() ?? null,
    };
  }

  const isEdit = !!post;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh' }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="news" />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          background: '#F4F2EE',
          color: '#1B2430',
          fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: '#9AA3AF', marginBottom: 20 }}>
            <Link href={`/${slug}/admin/news`} style={{ color: '#9AA3AF', textDecoration: 'none' }}>
              소식
            </Link>{' '}
            / {isEdit ? '편집' : '새 글 쓰기'}
          </div>

          <h1 style={{ margin: '0 0 28px', fontSize: 24, fontWeight: 700 }}>
            {isEdit ? '소식 편집' : '새 글 쓰기'}
          </h1>

          <NewsEditClient slug={slug} post={post} />
        </div>
      </main>
    </div>
  );
}
