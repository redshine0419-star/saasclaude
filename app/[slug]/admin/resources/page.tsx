import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { studentPageAuth } from '@/lib/students/page-auth';
import { asFiles } from '@/lib/resources';
import { ResourcesClient, type ResourceRow } from './ResourcesClient';

type Props = { params: Promise<{ slug: string }> };

export default async function ResourcesAdminPage({ params }: Props) {
  const { slug } = await params;
  const { tenant } = await studentPageAuth(slug);
  const items = await prisma.resource.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  const rows: ResourceRow[] = items.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body ?? '',
    files: asFiles(r.files),
    visibility: r.visibility === 'link' ? 'link' : 'public',
    pinned: r.pinned,
    createdAt: r.createdAt.toISOString(),
    shareUrl: `${base}/${slug}/resources/${r.id}?k=${r.shareToken}`,
  }));

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="resources" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>자료실</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
            수업 자료·가정통신문·안내문 파일을 올리면 학부모가 홈페이지에서 보고 내려받습니다. 재원생에게만 보낼 자료는 &ldquo;링크로만 공유&rdquo;를 고르세요.
          </div>
        </div>
        <ResourcesClient slug={slug} rows={rows} />
      </main>
    </div>
  );
}
