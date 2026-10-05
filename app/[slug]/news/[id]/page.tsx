import { notFound } from 'next/navigation';
import { getAcademyPageData, getPostData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

function formatDate(d: Date | string | null) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const [data, post] = await Promise.all([getAcademyPageData(slug), getPostData(slug, id)]);
  if (!data || !post) notFound();

  const { tenant, posts } = data;

  const currentIndex = posts.findIndex((p) => p.id === id);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  const summaryEntries = post.summaryFields ? Object.entries(post.summaryFields) : [];

  return (
    <>
      <SiteHeader
        name={tenant.name}
        slug={slug}
        activePage="news"
        phone={tenant.phone}
        kakaoChannelUrl={tenant.kakaoChannelUrl}
        address={tenant.address}
        hours={tenant.hours}
      />
      <main className="bg-bg min-h-screen">
        <div className="max-w-[800px] mx-auto px-5 md:px-8 pt-10 pb-20">
          {/* 뒤로 가기 */}
          <a
            href={`/${slug}/news`}
            className="inline-flex items-center gap-2 text-[15px] text-body no-underline hover:text-ink mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            소식 목록
          </a>

          {/* 배지 + 날짜 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="h-7 px-3 rounded-full bg-white text-[13px] font-semibold text-body">
            {{ notice: '공지', recruit: '특강 모집', exam: '시험 대비', gallery: '갤러리' }[post.category] ?? post.category}
          </span>
            <span className="text-[14px] text-body">{formatDate(post.publishedAt)}</span>
          </div>

          {/* 제목 */}
          <h1 className="font-serif text-[28px] md:text-[40px] leading-snug m-0 mb-8">{post.title}</h1>

          {/* 요약 카드 (summaryFields) */}
          {summaryEntries.length > 0 && (
            <div className={`grid grid-cols-2 md:grid-cols-${Math.min(summaryEntries.length, 4)} gap-4 mb-8`}>
              {summaryEntries.map(([key, val]) => (
                <div key={key} className="p-5 bg-white rounded-[14px] flex flex-col gap-1">
                  <span className="text-[13px] text-body">{key}</span>
                  <span className="text-[18px] font-bold">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* 커버 이미지 */}
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full rounded-[16px] mb-8 object-cover max-h-[400px]"
            />
          )}

          {/* 본문 */}
          {post.body && (
            <div className="prose prose-lg max-w-none text-[16px] leading-[1.8] text-ink mb-10 whitespace-pre-line">
              {post.body}
            </div>
          )}

          {/* CTA */}
          <div className="p-8 rounded-[20px] bg-accent text-on-accent flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12">
            <p className="font-serif text-[20px] md:text-[24px] m-0">레벨테스트 예약하기</p>
            <a
              href={`/${slug}/consult`}
              className="h-[52px] px-7 rounded-[12px] bg-white text-accent font-bold text-[16px] flex items-center no-underline hover:opacity-90 transition-opacity flex-shrink-0"
            >
              무료 신청
            </a>
          </div>

          {/* 이전/다음 */}
          <div className="flex flex-col gap-2 border-t border-line pt-6">
            {prevPost && (
              <a href={`/${slug}/news/${prevPost.id}`} className="flex items-center gap-3 py-3 text-[15px] text-body no-underline hover:text-ink group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                <span className="text-[12px]">이전</span>
                <span className="font-medium text-ink truncate">{prevPost.title}</span>
              </a>
            )}
            {nextPost && (
              <a href={`/${slug}/news/${nextPost.id}`} className="flex items-center gap-3 py-3 text-[15px] text-body no-underline hover:text-ink border-t border-line justify-end group">
                <span className="font-medium text-ink truncate">{nextPost.title}</span>
                <span className="text-[12px]">다음</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </a>
            )}
          </div>
        </div>
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
      <MobileBottomBar tenant={tenant} />
    </>
  );
}
