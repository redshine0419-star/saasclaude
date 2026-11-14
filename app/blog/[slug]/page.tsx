import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FdHeader } from '@/components/fd/FdHeader';
import { FdFooter } from '@/components/fd/FdFooter';
import { Markdown, BlogCta } from '@/components/blog/Markdown';
import { BlogCard, blogDate } from '@/components/blog/BlogCard';
import { categoryLabel, excerpt } from '@/lib/blog';
import { parseMarkdown, readingMinutes, tableOfContents, extractFaq } from '@/lib/blog/markdown';
import { getPublishedPost, relatedPosts, BLOG_BASE_URL } from '@/lib/blog/queries';

// 공개 날짜가 된 예약 글도 늦어도 5분 안에 보이게
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

const abs = (u: string) => (u.startsWith('/') ? `${BLOG_BASE_URL}${u}` : u);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: '글을 찾을 수 없습니다 — 첫등원 블로그' };
  const title = `${post.seoTitle || post.title} — 첫등원 블로그`;
  const description = excerpt(post.summary, post.body, 150);
  const url = `${BLOG_BASE_URL}/blog/${post.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article', url, title: post.seoTitle || post.title, description, siteName: '첫등원', locale: 'ko_KR',
      publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString(),
      ...(post.coverImage && { images: [{ url: abs(post.coverImage), width: 1200, height: 630 }] }),
    },
    twitter: { card: post.coverImage ? 'summary_large_image' : 'summary', title: post.seoTitle || post.title, description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  const blocks = parseMarkdown(post.body);
  const toc = tableOfContents(blocks);
  const related = await relatedPosts(post);
  const url = `${BLOG_BASE_URL}/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: excerpt(post.summary, post.body, 150),
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: url,
    url,
    inLanguage: 'ko-KR',
    articleSection: categoryLabel(post.category),
    ...(post.coverImage && { image: abs(post.coverImage) }),
    author: { '@type': 'Organization', name: '첫등원', url: BLOG_BASE_URL },
    publisher: { '@type': 'Organization', name: '첫등원', url: BLOG_BASE_URL },
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '첫등원', item: BLOG_BASE_URL },
      { '@type': 'ListItem', position: 2, name: '블로그', item: `${BLOG_BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };
  // 본문의 "### Q. …" 질문·답 → FAQPage (검색엔진·AI 검색이 질문과 답으로 읽는다)
  const faq = extractFaq(blocks);
  const faqLd = faq.length > 0 && {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  // JSON-LD 안의 </script> 차단
  const ld = (o: object) => JSON.stringify(o).replace(/</g, '\\u003c');

  return (
    <div data-theme="fd" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif", background: '#FFFFFF', color: '#14213D', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(crumbs) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(faqLd) }} />}
      <FdHeader active="blog" />
      <main style={{ flex: 1 }}>
        <article style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(32px, 5vw, 64px) 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <nav aria-label="위치" style={{ fontSize: 14, display: 'flex', gap: 6, color: '#6B7482', flexWrap: 'wrap' }}>
            <Link href="/blog" style={{ color: '#6B7482', textDecoration: 'none' }}>블로그</Link>
            <span aria-hidden="true">›</span>
            <Link href={`/blog?c=${post.category}`} style={{ color: '#8A6400', fontWeight: 700, textDecoration: 'none' }}>{categoryLabel(post.category)}</Link>
          </nav>
          <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.3, letterSpacing: '-0.6px', fontWeight: 700, wordBreak: 'keep-all' }}>{post.title}</h1>
          {post.summary && <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7, color: '#4A5568', wordBreak: 'keep-all' }}>{post.summary}</p>}
          <div style={{ fontSize: 14, color: '#8A93A0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <time dateTime={post.publishedAt?.toISOString()}>{blogDate(post.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>읽는 시간 약 {readingMinutes(post.body)}분</span>
            <span aria-hidden="true">·</span>
            <span>첫등원</span>
          </div>
          {post.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt="" style={{ width: '100%', aspectRatio: '1200 / 630', objectFit: 'cover', borderRadius: 16, border: '1px solid #E3E7EE', marginTop: 6 }} />
          )}
          {toc.length >= 3 && (
            <nav aria-label="목차" style={{ marginTop: 6, padding: '16px 20px', background: '#F7F8FA', border: '1px solid #E3E7EE', borderRadius: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>목차</div>
              <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 15, lineHeight: 1.55 }}>
                {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} style={{ color: '#23345C', textDecoration: 'none' }}>{t.text}</a></li>)}
              </ol>
            </nav>
          )}
          <div style={{ marginTop: 8 }}>
            <Markdown blocks={blocks} />
          </div>
          <BlogCta />
        </article>

        {related.length > 0 && (
          <section style={{ background: '#F7F8FA', padding: '48px 20px 64px', marginTop: 40 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>함께 읽으면 좋은 글</h2>
                <Link href="/blog" style={{ fontSize: 14, color: '#4A5568', textDecoration: 'none', whiteSpace: 'nowrap' }}>전체 글 →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
                {related.map((r) => <BlogCard key={r.id} post={r} />)}
              </div>
            </div>
          </section>
        )}
      </main>
      <FdFooter />
    </div>
  );
}
