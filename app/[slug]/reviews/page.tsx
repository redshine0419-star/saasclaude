import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) return {};
  return { title: `후기 — ${data.tenant.name}` };
}

const GRADE_BAND_FILTER_OPTIONS = [
  { key: '', label: '전체' },
  { key: '중등', label: '중등' },
  { key: '고등', label: '고등' },
  { key: 'score', label: '성적 변화 사례' },
];

const PER_PAGE = 12;

function pageHref(slug: string, filter: string, page: number) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/${slug}/reviews${qs ? `?${qs}` : ''}`;
}

export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant } = data;
  const activeFilter = sp.filter ?? '';
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const isDemoSlug = ['demo', 'demo-warm', 'demo-result', 'demo-bright'].includes(slug);

  type ReviewRow = {
    id: string;
    kind: string;
    body: string | null;
    authorLabel: string | null;
    source: string | null;
    beforeValue: string | null;
    afterValue: string | null;
    periodLabel: string | null;
    comment: string | null;
    gradeBand: string | null;
  };

  let textReviews: ReviewRow[] = [];
  let scoreReviews: ReviewRow[] = [];
  let textTotal = 0;
  let scoreTotal = 0;

  if (isDemoSlug) {
    const allText = data.reviews.filter(
      (r) => r.kind === 'review' || r.kind === 'text',
    );
    const allScore = data.reviews.filter(
      (r) => r.kind === 'score_case' || r.kind === 'score',
    );
    const filteredText =
      activeFilter === 'score'
        ? []
        : activeFilter
          ? allText.filter((r) => r.gradeBand === activeFilter)
          : allText;
    const filteredScore =
      activeFilter === '' || activeFilter === 'score'
        ? allScore
        : allScore.filter((r) => r.gradeBand === activeFilter);

    textTotal = filteredText.length;
    scoreTotal = filteredScore.length;
    textReviews = filteredText.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    scoreReviews = filteredScore.slice(0, 6);
  } else {
    const tenantRecord = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
    if (!tenantRecord) notFound();

    const baseWhere = { tenantId: tenantRecord.id, visible: true };
    const gradeBandWhere =
      activeFilter && activeFilter !== 'score' ? { gradeBand: activeFilter } : {};

    if (activeFilter !== 'score') {
      const textWhere = { ...baseWhere, ...gradeBandWhere, kind: 'review' as const };
      const [rows, count] = await Promise.all([
        prisma.review.findMany({
          where: textWhere,
          orderBy: { createdAt: 'desc' },
          skip: (currentPage - 1) * PER_PAGE,
          take: PER_PAGE,
        }),
        prisma.review.count({ where: textWhere }),
      ]);
      textTotal = count;
      textReviews = rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        body: r.body,
        authorLabel: r.authorLabel,
        source: r.source,
        beforeValue: r.beforeValue,
        afterValue: r.afterValue,
        periodLabel: r.periodLabel,
        comment: r.comment,
        gradeBand: r.gradeBand,
      }));
    }

    if (activeFilter === '' || activeFilter === 'score') {
      const scoreWhere = { ...baseWhere, ...gradeBandWhere, kind: 'score_case' as const };
      const rows = await prisma.review.findMany({
        where: scoreWhere,
        orderBy: { createdAt: 'desc' },
        take: 6,
      });
      scoreTotal = rows.length;
      scoreReviews = rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        body: r.body,
        authorLabel: r.authorLabel,
        source: r.source,
        beforeValue: r.beforeValue,
        afterValue: r.afterValue,
        periodLabel: r.periodLabel,
        comment: r.comment,
        gradeBand: r.gradeBand,
      }));
    }
  }

  const totalPages = Math.max(1, Math.ceil(textTotal / PER_PAGE));
  const hasAnyData = textReviews.length > 0 || scoreReviews.length > 0;

  const gradeBandsWithData = new Set(textReviews.map((r) => r.gradeBand).filter(Boolean));
  const visibleFilters = GRADE_BAND_FILTER_OPTIONS.filter(
    (opt) =>
      opt.key === '' ||
      (opt.key === 'score' && scoreTotal > 0) ||
      gradeBandsWithData.has(opt.key),
  );

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
        {visibleFilters.length > 1 && (
          <div className="px-5 md:px-20 pb-7 flex gap-2 flex-wrap">
            {visibleFilters.map((opt) => {
              const isActive = activeFilter === opt.key;
              const href = opt.key ? `/${slug}/reviews?filter=${opt.key}` : `/${slug}/reviews`;
              return (
                <a
                  key={opt.key}
                  href={href}
                  className={[
                    'h-11 px-5 rounded-full text-[15px] font-medium no-underline',
                    isActive
                      ? 'bg-ink text-white'
                      : 'border border-input-line bg-transparent text-ink hover:bg-white transition-colors',
                  ].join(' ')}
                >
                  {opt.label}
                </a>
              );
            })}
          </div>
        )}

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
              {activeFilter === '' && currentPage === 1 && tenant.naverPlaceUrl && (
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

        {/* 후기 페이지네이션 */}
        {totalPages > 1 && activeFilter !== 'score' && (
          <section className="px-5 md:px-20 pb-8 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <a
                href={pageHref(slug, activeFilter, currentPage - 1)}
                className="h-11 px-5 rounded-full border border-input-line text-[15px] no-underline text-ink hover:bg-white transition-colors flex items-center"
              >
                ← 이전
              </a>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={pageHref(slug, activeFilter, p)}
                className={[
                  'w-11 h-11 rounded-full text-[15px] no-underline flex items-center justify-center',
                  p === currentPage
                    ? 'bg-ink text-white font-bold'
                    : 'border border-input-line text-ink hover:bg-white transition-colors',
                ].join(' ')}
              >
                {p}
              </a>
            ))}
            {currentPage < totalPages && (
              <a
                href={pageHref(slug, activeFilter, currentPage + 1)}
                className="h-11 px-5 rounded-full border border-input-line text-[15px] no-underline text-ink hover:bg-white transition-colors flex items-center"
              >
                다음 →
              </a>
            )}
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

        {!hasAnyData && (
          <section className="px-5 md:px-20 pb-20 text-center text-body text-[16px] py-20">
            {activeFilter ? '해당 조건의 후기가 없습니다.' : '아직 등록된 후기가 없습니다.'}
          </section>
        )}
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
      <MobileBottomBar tenant={tenant} slug={slug} />
    </>
  );
}
