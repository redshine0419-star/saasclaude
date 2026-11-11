import Link from 'next/link';
import { categoryLabel, excerpt } from '@/lib/blog';
import type { BlogListItem } from '@/lib/blog/queries';

export const blogDate = (d: Date | null) => (d ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(d) : '');

export function BlogCard({ post }: { post: BlogListItem }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: '#14213D', background: '#FFFFFF', border: '1px solid #E3E7EE', borderRadius: 16, overflow: 'hidden', minWidth: 0 }}>
      <div style={{ aspectRatio: '1200 / 630', background: post.coverImage ? '#F3F5F8' : 'linear-gradient(135deg, #14213D 0%, #23345C 100%)', position: 'relative' }}>
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', alignItems: 'flex-end', color: '#FFFFFF', fontSize: 18, fontWeight: 700, lineHeight: 1.4, wordBreak: 'keep-all' }}>
            <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</span>
          </div>
        )}
      </div>
      <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          {post.pinned && <span style={{ padding: '1px 8px', borderRadius: 6, background: '#FFF4D6', color: '#8A5A00', fontWeight: 700, fontSize: 12 }}>추천</span>}
          <span style={{ color: '#8A6400', fontWeight: 700 }}>{categoryLabel(post.category)}</span>
        </div>
        <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.45, fontWeight: 700, wordBreak: 'keep-all' }}>{post.title}</h3>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: '#4A5568', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'keep-all' }}>{excerpt(post.summary, post.body)}</p>
        <div style={{ marginTop: 'auto', paddingTop: 6, fontSize: 13, color: '#8A93A0' }}>{blogDate(post.publishedAt)}</div>
      </div>
    </Link>
  );
}
