import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

function formatDate(d: Date | string | null) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant, posts } = data;

  const [featured, ...rest] = posts;

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
        {/* 페이지 헤더 */}
        <section className="px-5 md:px-20 pt-[72px] pb-8">
          <p className="text-[15px] font-bold text-accent mb-[14px]">소식</p>
          <h1 className="font-serif text-[36px] md:text-[52px] leading-snug m-0">
            {tenant.name} 소식
          </h1>
        </section>

        {/* 필터 탭 */}
        <div className="px-5 md:px-20 pb-7 flex gap-2 flex-wrap">
          {['전체', '시험 대비', '원장 칼럼', '학원 소식'].map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={[
                'h-11 px-5 rounded-full text-[15px] font-medium',
                i === 0
                  ? 'bg-ink text-white border-none'
                  : 'border border-input-line bg-transparent text-ink',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 피처드 포스트 */}
        {featured && (
          <section className="px-5 md:px-20 pb-8">
            <a
              href={`/${slug}/news/${featured.id}`}
              className="block bg-white rounded-[16px] overflow-hidden no-underline text-ink hover:shadow-md transition-shadow"
              style={{ borderTop: '4px solid #1E5645' }}
            >
              {featured.imageUrl && (
                <img src={featured.imageUrl} alt={featured.title} className="w-full h-[240px] md:h-[360px] object-cover" />
              )}
              <div className="p-6 md:p-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-6 px-2 rounded-full bg-bg text-[12px] font-semibold text-body">{featured.category}</span>
                  <span className="text-[13px] text-body">{formatDate(featured.publishedAt)}</span>
                </div>
                <h2 className="font-serif text-[22px] md:text-[28px] m-0 mb-3">{featured.title}</h2>
                {featured.summary && (
                  <p className="text-[15px] text-body leading-relaxed m-0 line-clamp-2">{featured.summary}</p>
                )}
              </div>
            </a>
          </section>
        )}

        {/* 목록 */}
        {rest.length > 0 && (
          <section className="px-5 md:px-20 pb-12">
            <div className="flex flex-col gap-0">
              {rest.map((post, i) => (
                <a
                  key={post.id}
                  href={`/${slug}/news/${post.id}`}
                  className={[
                    'flex items-start gap-4 md:gap-6 py-5 no-underline text-ink hover:bg-white rounded-[12px] px-4 -mx-4 transition-colors',
                    i !== 0 ? 'border-t border-line' : '',
                  ].join(' ')}
                >
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt={post.title} className="w-[80px] h-[60px] md:w-[120px] md:h-[90px] object-cover rounded-[10px] flex-shrink-0" />
                  )}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[13px] text-body">
                      <span>{post.category}</span>
                      <span>·</span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <h3 className="text-[16px] md:text-[18px] font-semibold m-0 line-clamp-2">{post.title}</h3>
                    {post.summary && (
                      <p className="text-[14px] text-body m-0 line-clamp-1 hidden md:block">{post.summary}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {posts.length === 0 && (
          <section className="px-5 md:px-20 pb-20 text-center text-body text-[16px] py-20">
            아직 등록된 소식이 없습니다.
          </section>
        )}
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
      <MobileBottomBar tenant={tenant} />
    </>
  );
}
