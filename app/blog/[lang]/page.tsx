import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { list } from '@vercel/blob';
import type { PostIndex } from '@/app/api/blog/generate/route';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';

type Lang = 'ko' | 'en' | 'ja';

async function getPosts(lang: Lang): Promise<PostIndex[]> {
  try {
    const { blobs } = await list({ prefix: `posts-index-${lang}.json` });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ tag?: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { tag } = await searchParams;

  const title = lang === 'ko'
    ? 'SEO·GEO·AI 마케팅 실전 블로그 | GrowWeb.me'
    : lang === 'ja'
    ? 'SEO・GEO・AIマーケティング実践ブログ | GrowWeb.me'
    : 'SEO, GEO & AI Marketing Blog for Startups | GrowWeb.me';
  const description = lang === 'ko'
    ? '1인 마케터·스타트업을 위한 SEO, GEO(AI 검색 최적화), GA4 분석, 콘텐츠 전략 실전 가이드. 경쟁 없는 롱테일 키워드 발굴부터 ChatGPT·Perplexity 노출 전략까지 매일 새 글이 올라옵니다.'
    : lang === 'ja'
    ? '個人マーケター・スタートアップ向けSEO、GEO（AI検索最適化）、GA4分析、コンテンツ戦略の実践ガイド。競合の少ないロングテールキーワード発掘からChatGPT・Perplexity表示戦略まで、毎日新記事を公開中。'
    : 'Practical SEO, GEO (AI search optimization), GA4 analytics, and content strategy guides for solo marketers and startups. From finding low-competition long-tail keywords to getting cited in ChatGPT and Perplexity — new posts daily.';

  // ?tag= 필터 페이지는 noindex — 중복 색인 방지
  if (tag) {
    return {
      title,
      description,
      robots: { index: false, follow: true },
      alternates: { canonical: `${SITE_URL}/blog/${lang}` },
    };
  }

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/blog/${lang}`,
      languages: { 'ko': `${SITE_URL}/blog/ko`, 'en': `${SITE_URL}/blog/en`, 'ja': `${SITE_URL}/blog/ja` },
    },
  };
}

export default async function BlogListPage({ params, searchParams }: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const { lang } = await params;
  const { tag } = await searchParams;

  if (lang !== 'ko' && lang !== 'en' && lang !== 'ja') notFound();

  const posts = await getPosts(lang as Lang);
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const filtered = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
  const isKo = lang === 'ko';
  const isJa = lang === 'ja';

  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#0d1117]">
      {/* Header */}
      <div className="border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-sm text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">
              ← GrowWeb.me
            </Link>
            {/* Language switcher */}
            <div className="flex items-center gap-1 text-sm border border-[#d0d7de] dark:border-[#30363d] rounded-md overflow-hidden">
              <Link href="/blog/ko" className={`px-3 py-1 transition-colors ${lang === 'ko' ? 'bg-[#000000] text-white' : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}>KO</Link>
              <Link href="/blog/en" className={`px-3 py-1 transition-colors ${lang === 'en' ? 'bg-[#000000] text-white' : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}>EN</Link>
              <Link href="/blog/ja" className={`px-3 py-1 transition-colors ${lang === 'ja' ? 'bg-[#000000] text-white' : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}>JA</Link>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#24292f] dark:text-[#e6edf3]">
            {isKo
              ? 'SEO · GEO · AI 마케팅 실전 가이드'
              : isJa
              ? 'SEO・GEO・AIマーケティング実践ガイド'
              : 'SEO, GEO & AI Marketing — Practical Guides'}
          </h1>
          <p className="mt-2 text-[#57606a] dark:text-[#8b949e] max-w-2xl leading-relaxed">
            {isKo
              ? '1인 마케터·스타트업을 위한 GA4 분석, 롱테일 키워드 발굴, ChatGPT·Perplexity 노출 전략까지 — 에이전시 없이 혼자 실행할 수 있는 실전 방법만 다룹니다.'
              : isJa
              ? '個人マーケター・スタートアップ向け。GA4分析、ロングテールキーワード、ChatGPT/Perplexity表示戦略など、エージェンシーなしで実行できる実践的な方法だけを扱います。'
              : 'For solo marketers and startups: GA4 analytics, long-tail keywords, getting cited in ChatGPT & Perplexity — actionable tactics you can run without an agency.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href={`/blog/${lang}`}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                !tag
                  ? 'bg-[#000000] text-white border-[#000000]'
                  : 'border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:border-[#57606a]'
              }`}
            >
              {isKo ? '전체' : isJa ? 'すべて' : 'All'}
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/blog/${lang}?tag=${encodeURIComponent(t)}`}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  tag === t
                    ? 'bg-[#000000] text-white border-[#000000]'
                    : 'border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:border-[#57606a]'
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {/* Post grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#57606a] dark:text-[#8b949e]">
            <p className="text-lg">{isKo ? '아직 게시글이 없습니다.' : isJa ? 'まだ投稿がありません。' : 'No posts yet.'}</p>
            <p className="text-sm mt-2">{isKo ? '관리자 페이지에서 AI로 첫 글을 생성해보세요.' : isJa ? '管理画面からAIで最初の記事を生成してみてください。' : 'Generate your first post with AI from the admin panel.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${lang}/${post.slug}`}
                className="group block border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-5 hover:border-[#57606a] dark:hover:border-[#8b949e] hover:shadow-sm transition-all bg-white dark:bg-[#161b22]"
              >
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] text-xs rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3] group-hover:text-[#000000] dark:group-hover:text-white line-clamp-2 mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-[#57606a] dark:text-[#8b949e] line-clamp-3 leading-relaxed">
                  {post.metaDescription}
                </p>
                <div className="mt-4 text-xs text-[#8b949e]">
                  {new Date(post.createdAt).toLocaleDateString(isKo ? 'ko-KR' : isJa ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
