import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { list } from '@vercel/blob';
import type { BlogPost, PostIndex } from '@/app/api/blog/generate/route';

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

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPost(lang, slug);
  if (!post) return { title: 'Not Found' };

  return {
    title: `${post.title} | MarketerOps.ai`,
    description: post.metaDescription,
    alternates: {
      languages: {
        'ko': `/blog/ko/${slug}`,
        'en': `/blog/en/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: post.createdAt,
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;

  if (lang !== 'ko' && lang !== 'en') notFound();

  const post = await getPost(lang, slug);
  if (!post) notFound();

  const related = await getRelated(lang, slug, post.tags);
  const isKo = lang === 'ko';

  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#0d1117]">
      {/* Nav */}
      <div className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between text-sm">
          <Link href={`/blog/${lang}`} className="text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">
            ← {isKo ? '블로그 목록' : 'All posts'}
          </Link>
          <div className="flex items-center gap-1 border border-[#d0d7de] dark:border-[#30363d] rounded-md overflow-hidden text-xs">
            <Link href={`/blog/ko/${slug}`} className={`px-3 py-1 ${lang === 'ko' ? 'bg-[#000000] text-white' : 'text-[#57606a] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'} transition-colors`}>KO</Link>
            <Link href={`/blog/en/${slug}`} className={`px-3 py-1 ${lang === 'en' ? 'bg-[#000000] text-white' : 'text-[#57606a] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'} transition-colors`}>EN</Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/blog/${lang}?tag=${encodeURIComponent(t)}`}
                className="px-2 py-0.5 bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] text-xs rounded-full border border-[#d0d7de] dark:border-[#30363d] hover:border-[#57606a] transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#24292f] dark:text-[#e6edf3] leading-tight mb-3">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-[#57606a] dark:text-[#8b949e] mb-8 pb-8 border-b border-[#d0d7de] dark:border-[#30363d]">
          <span>{new Date(post.createdAt).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>·</span>
          <span>MarketerOps.ai</span>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:text-[#24292f] dark:prose-headings:text-[#e6edf3]
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#d0d7de] dark:prose-h2:border-[#30363d]
          prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-[#24292f] dark:prose-p:text-[#c9d1d9] prose-p:leading-relaxed
          prose-a:text-[#000000] dark:prose-a:text-[#58a6ff] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-[#24292f] dark:prose-strong:text-[#e6edf3]
          prose-code:bg-[#f6f8fa] dark:prose-code:bg-[#161b22] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-[#f6f8fa] dark:prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-[#d0d7de] dark:prose-pre:border-[#30363d]
          prose-ul:list-disc prose-ol:list-decimal
          prose-li:text-[#24292f] dark:prose-li:text-[#c9d1d9]
          prose-blockquote:border-l-4 prose-blockquote:border-[#d0d7de] dark:prose-blockquote:border-[#30363d] prose-blockquote:text-[#57606a] dark:prose-blockquote:text-[#8b949e]
        ">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-14 pt-8 border-t border-[#d0d7de] dark:border-[#30363d]">
            <h3 className="text-lg font-semibold text-[#24292f] dark:text-[#e6edf3] mb-4">
              {isKo ? '관련 포스트' : 'Related Posts'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${lang}/${p.slug}`}
                  className="block border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-4 hover:border-[#57606a] transition-colors"
                >
                  <h4 className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3] line-clamp-2 leading-snug">{p.title}</h4>
                  <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-2 line-clamp-2">{p.metaDescription}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
