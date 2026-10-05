import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant, reviews } = data;

  const textReviews = reviews.filter((r) => r.kind === 'review' || r.kind === 'text');
  const scoreReviews = reviews.filter((r) => r.kind === 'score_case' || r.kind === 'score');

  return (
    <>
      <SiteHeader
        name={tenant.name}
        slug={slug}
        activePage="reviews"
        phone={tenant.phone}
        kakaoChannelUrl={tenant.kakaoChannelUrl}
        address={tenant.address}
        hours={tenant.hours}
      />
      <main className="bg-bg min-h-screen">
        {/* 페이지 헤더 */}
        <section className="px-5 md:px-20 pt-[72px] pb-8">
          <p className="text-[15px] font-bold text-accent mb-[14px]">성과·후기</p>
          <h1 className="font-serif text-[36px] md:text-[52px] leading-snug m-0">
            학부모님이 직접 남긴 이야기
          </h1>
          <p className="text-[17px] text-body mt-4 m-0">모든 후기는 작성자 동의를 받아 원문 그대로 옮겼습니다.</p>
        </section>

        {/* 필터 탭 */}
        <div className="px-5 md:px-20 pb-7 flex gap-2 flex-wrap">
          {['전체', '중등', '고등', '성적 변화 사례'].map((tab, i) => (
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

        {/* 후기 카드 그리드 */}
        {textReviews.length > 0 && (
          <section className="px-5 md:px-20 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {textReviews.map((r) => (
                <div key={r.id} className="p-8 bg-white rounded-[16px] flex flex-col gap-5">
                  <p className="font-serif text-[19px] leading-[1.75] m-0">"{r.body}"</p>
                  <div className="text-[14px] text-body">
                    {r.authorLabel}
                    {r.source && ` · ${r.source}`}
                  </div>
                </div>
              ))}
              {tenant.naverPlaceUrl && (
                <a
                  href={tenant.naverPlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-8 bg-transparent border border-dashed border-[#B7B0A2] rounded-[16px] flex flex-col gap-2 justify-center text-ink no-underline hover:bg-white transition-colors"
                >
                  <span className="text-[18px] font-bold">네이버 리뷰 전체 보기</span>
                  <span className="text-[14px] text-body">네이버 플레이스로 이동</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* 성적 변화 사례 */}
        {scoreReviews.length > 0 && (
          <section className="px-5 md:px-20 pb-20">
            <h2 className="font-serif text-[28px] md:text-[36px] m-0 mb-6">성적 변화 사례</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scoreReviews.map((r) => (
                <div key={r.id} className="p-9 bg-accent text-on-accent rounded-[16px] flex flex-col gap-4">
                  <div className="text-[14px] font-semibold opacity-80">{r.authorLabel}</div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-[44px] font-bold">{r.beforeValue}</span>
                    <span className="text-[20px] opacity-70">→</span>
                    <span className="text-[44px] font-bold">{r.afterValue}</span>
                  </div>
                  {r.periodLabel && (
                    <div className="text-[15px] opacity-80">{r.periodLabel}</div>
                  )}
                  {r.comment && (
                    <p className="text-[15px] leading-relaxed m-0 opacity-90">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-body">
              성적 사례는 학생·학부모 서면 동의를 받은 경우에만 게재하며, 개인을 특정할 수 있는 정보는 싣지 않습니다.
            </p>
          </section>
        )}
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
      <MobileBottomBar tenant={tenant} />
    </>
  );
}
