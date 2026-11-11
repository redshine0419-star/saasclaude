import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';
import { categoryLabel } from '@/lib/blog';

export const dynamic = 'force-dynamic';

const fmt = (d: Date) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

export default async function PlatformBlogPage() {
  const now = new Date();
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ pinned: 'desc' }, { publishedAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
    select: { id: true, slug: true, title: true, category: true, status: true, publishedAt: true, pinned: true, updatedAt: true },
  });

  const badge = (p: (typeof posts)[number]) => {
    if (p.status !== 'published') return { text: '숨김', bg: '#EEF0F3', fg: '#5A6270' };
    if (p.publishedAt && p.publishedAt > now) return { text: '예약', bg: '#FFF4D6', fg: '#8A5A00' };
    return { text: '공개', bg: '#E3F1EA', fg: '#1E5645' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif", width: '100%' }}>
      <PlatformSide active="blog" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }} className="adm-main">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>블로그</h1>
            <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
              growweb.me/blog 에 올라가는 원장님 대상 글입니다. 운영자만 쓸 수 있고, &ldquo;공개&rdquo;로 저장한 글만 보입니다.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/blog" target="_blank" rel="noopener noreferrer" style={{ height: 40, padding: '0 14px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>블로그 보기 ↗</a>
            <Link href="/platform/blog/new" style={{ height: 40, padding: '0 16px', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>+ 새 글</Link>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
          {posts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6270', fontSize: 14 }}>아직 글이 없습니다. &ldquo;+ 새 글&rdquo;로 첫 글을 써 보세요.</div>
          ) : (
            posts.map((p, i) => {
              const b = badge(p);
              return (
                <Link key={p.id} href={`/platform/blog/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: i ? '1px solid #EEEAE2' : 'none', textDecoration: 'none', color: '#1B2430', flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: b.bg, color: b.fg, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{b.text}</span>
                  {p.pinned && <span style={{ fontSize: 12, fontWeight: 700, color: '#8A5A00', flexShrink: 0 }}>고정</span>}
                  <span style={{ flex: '1 1 240px', minWidth: 0, fontSize: 15, fontWeight: 600 }}>{p.title}</span>
                  <span style={{ fontSize: 12, color: '#5A6270', flexShrink: 0 }}>{categoryLabel(p.category)}</span>
                  <span style={{ fontSize: 12, color: '#8A93A0', flexShrink: 0, fontFamily: 'monospace' }}>/blog/{p.slug}</span>
                  <span style={{ fontSize: 12, color: '#8A93A0', flexShrink: 0 }}>{p.publishedAt ? fmt(p.publishedAt) : `수정 ${fmt(p.updatedAt)}`}</span>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
