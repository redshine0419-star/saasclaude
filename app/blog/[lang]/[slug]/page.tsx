import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { list } from '@vercel/blob';
import type { BlogPost, PostIndex } from '@/app/api/blog/generate/route';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';

async function getPost(lang: string, slug: string): Promise<BlogPost | null> {
  try {
    const { blobs } = await list({ prefix: `posts/${lang}/${slug}.json` });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getRelated(lang: string, currentSlug: string, tags: string[]): Promise<PostIndex[]> {
  try {
    const { blobs } = await list({ prefix: `posts-index-${lang}.json` });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const index: PostIndex[] = await res.json();
    return index
      .filter((p) => p.slug !== currentSlug && p.tags.some((t) => tags.includes(t)))
      .slice(0, 3);
  } catch {
    return [];
  }
}

function readingTime(content: string, lang: string): number {
  const len = content.replace(/[#*`>\-\[\]()]/g, '').length;
  const wpm = lang === 'ko' || lang === 'ja' ? 500 : 200;
  return Math.max(1, Math.round(len / wpm));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPost(lang, slug);
  if (!post) return { title: 'Not Found' };

  return {
    title: `${post.title} | GrowWeb.me`,
    description: post.metaDescription,
    keywords: post.tags.join(', '),
    alternates: {
      canonical: `${SITE_URL}/blog/${lang}/${slug}`,
      languages: { ko: `/blog/ko/${slug}`, en: `/blog/en/${slug}`, ja: `/blog/ja/${slug}` },
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: post.createdAt,
      tags: post.tags,
      siteName: 'GrowWeb.me',
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;

  if (lang !== 'ko' && lang !== 'en' && lang !== 'ja') notFound();

  const post = await getPost(lang, slug);
  if (!post) notFound();

  const related = await getRelated(lang, slug, post.tags);
  const isKo = lang === 'ko';
  const isJa = lang === 'ja';
  const minutes = readingTime(post.content, lang);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    inLanguage: lang,
    keywords: post.tags.join(', '),
    author: { '@type': 'Organization', name: 'GrowWeb.me', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'GrowWeb.me', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${lang}/${slug}` },
  };

  const faqItems = post.faq ?? [];
  const faqJsonLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="min-h-screen bg-[#ffffff] dark:bg-[#0d1117]">
        {/* Top nav */}
        <div className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between text-sm">
            <Link href={`/blog/${lang}`} className="text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">
              ← {isKo ? '블로그 목록' : isJa ? '記事一覧' : 'All posts'}
            </Link>
            <div className="flex items-center gap-1 border border-[#d0d7de] dark:border-[#30363d] rounded-md overflow-hidden text-xs">
              <Link href={`/blog/ko/${slug}`} className={`px-3 py-1 transition-colors ${lang === 'ko' ? 'bg-[#000000] text-white' : 'text-[#57606a] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}>KO</Link>
              <Link href={`/blog/en/${slug}`} className={`px-3 py-1 transition-colors ${lang === 'en' ? 'bg-[#000000] text-white' : 'text-[#57606a] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}>EN</Link>
              <Link href={`/blog/ja/${slug}`} className={`px-3 py-1 transition-colors ${lang === 'ja' ? 'bg-[#000000] text-white' : 'text-[#57606a] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}>JA</Link>
            </div>
          </div>
        </div>

        {/* Article header */}
        <header className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] py-10 md:py-14">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/blog/${lang}?tag=${encodeURIComponent(t)}`}
                    className="px-2.5 py-0.5 bg-white dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] text-xs rounded-full border border-[#d0d7de] dark:border-[#30363d] hover:border-[#57606a] transition-colors"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}
            <h1
              className="text-3xl md:text-4xl font-bold text-[#24292f] dark:text-[#e6edf3] leading-[1.3] mb-5"
              style={{ letterSpacing: '-0.02em' }}
            >
              {post.title}
            </h1>
            <p className="text-lg text-[#57606a] dark:text-[#8b949e] leading-relaxed mb-6 max-w-2xl">
              {post.metaDescription}
            </p>
            <div className="flex items-center gap-4 text-sm text-[#57606a] dark:text-[#8b949e]">
              <span className="font-medium text-[#24292f] dark:text-[#e6edf3]">GrowWeb.me</span>
              <span>·</span>
              <time dateTime={post.createdAt}>
                {new Date(post.createdAt).toLocaleDateString(isKo ? 'ko-KR' : isJa ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <span>·</span>
              <span>{isKo ? `${minutes}분 읽기` : isJa ? `${minutes}分で読める` : `${minutes} min read`}</span>
            </div>
          </div>
        </header>

        {/* Article body — two-column layout on desktop */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <div className="lg:grid lg:grid-cols-[1fr_200px] lg:gap-12">
            {/* Main content */}
            <article itemScope itemType="https://schema.org/Article">
              <div
                className="
                  text-[17px] leading-[1.85] text-[#24292f] dark:text-[#c9d1d9]
                  [&>h2]:text-[1.5rem] [&>h2]:font-bold [&>h2]:text-[#24292f] dark:[&>h2]:text-[#e6edf3] [&>h2]:mt-14 [&>h2]:mb-5 [&>h2]:pb-3 [&>h2]:border-b [&>h2]:border-[#d0d7de] dark:[&>h2]:border-[#30363d] [&>h2]:tracking-tight
                  [&>h3]:text-[1.2rem] [&>h3]:font-semibold [&>h3]:text-[#24292f] dark:[&>h3]:text-[#e6edf3] [&>h3]:mt-9 [&>h3]:mb-3
                  [&>p]:mb-6 [&>p]:max-w-[680px]
                  [&>ul]:my-5 [&>ul]:ml-6 [&>ul]:space-y-2 [&>ul]:list-disc [&>ul]:max-w-[680px]
                  [&>ol]:my-5 [&>ol]:ml-6 [&>ol]:space-y-2 [&>ol]:list-decimal [&>ol]:max-w-[680px]
                  [&>li]:leading-[1.75]
                  [&>hr]:my-10 [&>hr]:border-[#d0d7de] dark:[&>hr]:border-[#30363d]
                  [&>pre]:my-5 [&>pre]:p-4 [&>pre]:bg-[#f6f8fa] dark:[&>pre]:bg-[#161b22] [&>pre]:border [&>pre]:border-[#d0d7de] dark:[&>pre]:border-[#30363d] [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:text-sm [&>pre]:font-mono
                "
              >
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-[1.5rem] font-bold text-[#24292f] dark:text-[#e6edf3] mt-14 mb-5 pb-3 border-b border-[#d0d7de] dark:border-[#30363d]" style={{ letterSpacing: '-0.02em' }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-[1.2rem] font-semibold text-[#24292f] dark:text-[#e6edf3] mt-9 mb-3">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-[17px] leading-[1.85] mb-6 max-w-[680px] text-[#24292f] dark:text-[#c9d1d9]">
                        {children}
                      </p>
                    ),
                    blockquote: ({ children }) => (
                      <div className="my-8 p-5 bg-[#f6f8fa] dark:bg-[#161b22] border-l-4 border-[#000000] dark:border-[#e6edf3] rounded-r-lg max-w-[680px]">
                        <div className="text-[15px] leading-[1.7] text-[#24292f] dark:text-[#e6edf3] [&>p]:mb-2 [&>p]:last:mb-0 [&>ul]:ml-4 [&>ul]:list-disc [&>ul]:space-y-1">
                          {children}
                        </div>
                      </div>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-5 ml-6 space-y-2 list-disc max-w-[680px]">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-5 ml-6 space-y-2 list-decimal max-w-[680px]">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-[17px] leading-[1.75] text-[#24292f] dark:text-[#c9d1d9]">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-[#24292f] dark:text-[#e6edf3]">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} className="text-[#000000] dark:text-[#58a6ff] underline underline-offset-2 hover:opacity-70 transition-opacity">
                        {children}
                      </a>
                    ),
                    code: ({ children }) => (
                      <code className="px-1.5 py-0.5 bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded text-[14px] font-mono text-[#24292f] dark:text-[#e6edf3]">
                        {children}
                      </code>
                    ),
                    hr: () => <hr className="my-10 border-[#d0d7de] dark:border-[#30363d]" />,
                    table: ({ children }) => (
                      <div className="my-6 overflow-x-auto max-w-[680px]">
                        <table className="w-full text-sm border-collapse border border-[#d0d7de] dark:border-[#30363d]">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-[#f6f8fa] dark:bg-[#21262d]">{children}</thead>,
                    th: ({ children }) => (
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#24292f] dark:text-[#e6edf3] border border-[#d0d7de] dark:border-[#30363d]">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2.5 text-[15px] text-[#24292f] dark:text-[#c9d1d9] border border-[#d0d7de] dark:border-[#30363d]">{children}</td>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>

              {/* Tags footer */}
              {post.tags.length > 0 && (
                <div className="mt-12 pt-6 border-t border-[#d0d7de] dark:border-[#30363d] flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/blog/${lang}?tag=${encodeURIComponent(t)}`}
                      className="px-3 py-1 text-xs border border-[#d0d7de] dark:border-[#30363d] rounded-full text-[#57606a] dark:text-[#8b949e] hover:border-[#57606a] transition-colors"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* Sidebar — FAQ summary on desktop */}
            {faqItems.length > 0 && (
              <aside className="hidden lg:block">
                <div className="sticky top-8">
                  <p className="text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-3">
                    {isKo ? '자주 묻는 질문' : isJa ? 'よくある質問' : 'FAQ'}
                  </p>
                  <ul className="space-y-3">
                    {faqItems.map((item, i) => (
                      <li key={i}>
                        <p className="text-xs leading-snug text-[#24292f] dark:text-[#c9d1d9] hover:text-[#000] cursor-default">
                          {item.q}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            )}
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-[#d0d7de] dark:border-[#30363d]">
              <h2 className="text-lg font-semibold text-[#24292f] dark:text-[#e6edf3] mb-6">
                {isKo ? '관련 포스트' : isJa ? '関連記事' : 'Related Posts'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${lang}/${p.slug}`}
                    className="group block border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-5 hover:border-[#57606a] dark:hover:border-[#8b949e] hover:shadow-sm transition-all bg-white dark:bg-[#161b22]"
                  >
                    <h3 className="text-sm font-semibold text-[#24292f] dark:text-[#e6edf3] line-clamp-2 leading-snug group-hover:underline">
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-2 line-clamp-2 leading-relaxed">
                      {p.metaDescription}
                    </p>
                    <p className="text-xs text-[#8b949e] mt-3">
                      {new Date(p.createdAt).toLocaleDateString(isKo ? 'ko-KR' : isJa ? 'ja-JP' : 'en-US')}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
