import type { Metadata } from 'next';
import Link from 'next/link';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogCta } from '@/components/blog/Markdown';
import { BLOG_CATEGORIES, isCategory, categoryLabel } from '@/lib/blog';
import { listPublishedPosts, BLOG_BASE_URL } from '@/lib/blog/queries';

type Props = { searchParams: Promise<{ c?: string; p?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { c, p } = await searchParams;
  const cat = isCategory(c) ? c : null;
  const title = cat ? `${categoryLabel(cat)} — 첫등원 블로그` : '첫등원 블로그 — 학원 원장님을 위한 운영·법규·홍보 가이드';
  return {
    title,
    description: '교습비 신고, 광고 문자 규정, 상담 관리, 학원 홍보까지. 동네 학원·교습소 원장님이 알아야 할 운영 정보를 정리합니다.',
    alternates: {
      canonical: `${BLOG_BASE_URL}/blog${cat ? `?c=${cat}` : ''}`,
      types: { 'application/rss+xml': `${BLOG_BASE_URL}/blog/rss.xml` },
    },
    // 2쪽 이후는 검색에 넣지 않는다 (글 상세가 색인되면 충분)
    ...(p && Number(p) > 1 && { robots: { index: false, follow: true } }),
    openGraph: { title, type: 'website', url: `${BLOG_BASE_URL}/blog`, siteName: '첫등원' },
  };
}

export default async function BlogListPage({ searchParams }: Props) {
  const { c, p } = await searchParams;
  const cat = isCategory(c) ? c : undefined;
  const { posts, page, pages } = await listPublishedPosts({ category: cat, page: Number(p) || 1 });
  const href = (k?: string, pg?: number) => {
    const q = new URLSearchParams();
    if (k) q.set('c', k);
    if (pg && pg > 1) q.set('p', String(pg));
    const s = q.toString();
    return `/blog${s ? `?${s}` : ''}`;
  };
  const tab = (active: boolean): React.CSSProperties => ({
    height: 38, padding: '0 16px', borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0,
    background: active ? '#14213D' : '#FFFFFF', color: active ? '#FFFFFF' : '#4A5568', border: `1px solid ${active ? '#14213D' : '#CDD3DD'}`,
  });

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <FdHeader active="blog" />
      <main style={{ flex: 1, padding: 'clamp(40px, 6vw, 80px) clamp(20px, 4vw, 56px)', background: '#F7F8FA' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8A6400', marginBottom: 10 }}>첫등원 블로그</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1.3, wordBreak: 'keep-all' }}>학원 원장님을 위한<br />운영 가이드</h1>
            <p style={{ margin: '14px 0 0', fontSize: 16.5, lineHeight: 1.75, color: '#4A5568', wordBreak: 'keep-all' }}>교습비 신고, 광고 문자 규정, 상담 관리, 학원 홍보까지. 동네 학원·교습소 운영에 필요한 내용을 정리합니다.</p>
          </div>

          <nav aria-label="분류" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            <Link href={href()} style={tab(!cat)}>전체</Link>
            {BLOG_CATEGORIES.map((x) => <Link key={x.key} href={href(x.key)} style={tab(cat === x.key)}>{x.label}</Link>)}
          </nav>

          {posts.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center', color: '#6B7482', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E3E7EE' }}>아직 올라온 글이 없습니다. 곧 첫 글을 올리겠습니다.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
              {posts.map((post) => <BlogCard key={post.id} post={post} />)}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="쪽" style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={href(cat, n)} aria-current={n === page ? 'page' : undefined} style={{ ...tab(n === page), width: 40, padding: 0, justifyContent: 'center' }}>{n}</Link>
              ))}
            </nav>
          )}

          <BlogCta />
        </div>
      </main>
      <FdFooter />
    </div>
  );
}
