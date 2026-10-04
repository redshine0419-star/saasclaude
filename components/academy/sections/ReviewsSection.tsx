import type { AcademyReview } from '@/lib/academy-data';

type Props = { reviews: AcademyReview[] };

export default function ReviewsSection({ reviews }: Props) {
  if (reviews.length === 0) return null;

  const textReviews = reviews.filter((r) => r.kind === 'review').slice(0, 2);
  const scoreCase = reviews.find((r) => r.kind === 'score_case');

  return (
    <section id="reviews" className="px-5 md:px-20 pt-16 md:pt-[120px]">
      <div className="flex flex-col gap-6 md:gap-8">
        {/* 헤더 */}
        <div className="flex flex-col gap-2.5 md:gap-3">
          <div className="text-[14px] md:text-[15px] font-bold text-label">성과·후기</div>
          <h2 className="m-0 font-serif text-[28px] md:text-[40px] font-bold text-ink">학부모님이 직접 남긴 이야기</h2>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {textReviews.map((r) => (
            <div key={r.id} className="p-6 md:p-8 bg-surface rounded-2xl flex flex-col gap-5">
              <p className="m-0 font-serif text-[17px] md:text-[19px] leading-[1.7] text-ink">
                "{r.body}"
              </p>
              <div className="text-[13px] md:text-sm text-muted">
                {[r.authorLabel, r.source].filter(Boolean).join(' · ')}
              </div>
            </div>
          ))}

          {/* 성적 사례 — 어두운 카드 */}
          {scoreCase && (
            <div className="p-6 md:p-8 bg-accent rounded-2xl flex flex-col gap-4">
              <div className="text-[13px] md:text-sm font-semibold text-on-accent/70">성적 변화 사례</div>
              <div className="flex items-center gap-3">
                {scoreCase.beforeValue && scoreCase.afterValue && (
                  <>
                    <span className="text-[22px] md:text-[26px] font-bold text-on-dark/60">{scoreCase.beforeValue}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-on-accent/50 flex-shrink-0" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    <span className="text-[28px] md:text-[32px] font-bold text-on-accent">{scoreCase.afterValue}</span>
                  </>
                )}
              </div>
              {scoreCase.periodLabel && (
                <div className="text-[16px] md:text-[18px] font-bold text-on-accent leading-snug">{scoreCase.periodLabel}</div>
              )}
              {scoreCase.comment && (
                <p className="m-0 text-[13px] md:text-[14px] leading-[1.7] text-on-accent/70">{scoreCase.comment}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
