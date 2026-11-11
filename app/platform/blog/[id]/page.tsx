import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';
import { BlogEditor, type EditorPost } from './BlogEditor';

export const dynamic = 'force-dynamic';

export default async function PlatformBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let post: EditorPost | null = null;
  if (id !== 'new') {
    const p = await prisma.blogPost.findUnique({ where: { id } });
    if (!p) notFound();
    post = {
      id: p.id, slug: p.slug, title: p.title, summary: p.summary ?? '', body: p.body, category: p.category,
      coverImage: p.coverImage ?? '', seoTitle: p.seoTitle ?? '', status: p.status === 'published' ? 'published' : 'draft',
      publishedAt: p.publishedAt?.toISOString() ?? null, pinned: p.pinned,
    };
  }
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", width: '100%' }}>
      <PlatformSide active="blog" />
      <main style={{ flex: 1, minWidth: 0, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BlogEditor post={post} />
      </main>
    </div>
  );
}
