import type { AcademyReview } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  reviews: AcademyReview[];
  title?: string;
  slug?: string;
  /** 첫 칸에 둘 사진 (테마 A). 없으면 후기 두 개를 보여 준다 */
  photo?: string | null;
};

export default function ReviewsSection({ reviews, slug, photo = null, title = SECTION_COPY_SPEC.reviews.title }: Props) {
  if (reviews.length === 0) return null;

  const textReviews = reviews.filter((r) => r.kind === 'review').slice(0, photo ? 1 : 2);
  const scoreCase = reviews.find((r) => r.kind === 'score_case');

  return (
    <section id="reviews" className="py-14 md:py-[76px]">
      <div className="acad-wrap">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <p className="acad-eyebrow">성과·후기</p>
            <h2 className="acad-h2"><TitleLines text={title} /></h2>
          </div>
          {slug && <a href={`/${slug}/reviews`} className="acad-more">후기 전체 보기 →</a>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[18px]">
          {photo && (
            <div className="h-[220px] md:h-auto md:min-h-[260px] rounded-[18px] overflow-hidden bg-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="수업을 마친 학생" className="w-full h-full object-cover" />
            </div>
          )}

          {textReviews.map((r) => (
            <article key={r.id} className="p-[25px] bg-surface border border-line rounded-[18px] flex flex-col">
              <p className="m-0 mb-5 font-serif text-[17px] leading-[1.8] text-ink">“{r.body}”</p>
              <small className="mt-auto text-[13px] text-muted">{[r.authorLabel, r.source].filter(Boolean).join(' · ')}</small>
            </article>
          ))}

          {/* 성적 사례 */}
          {scoreCase && (
            <article className="p-[25px] bg-accent text-on-accent rounded-[18px] flex flex-col">
              <p className="acad-eyebrow" style={{ color: 'color-mix(in srgb, var(--on-accent) 72%, var(--label))' }}>성적 변화 사례</p>
              {scoreCase.beforeValue && scoreCase.afterValue && (
                <strong className="block my-2 text-[28px] md:text-[32px] font-bold">
                  {scoreCase.beforeValue} → {scoreCase.afterValue}
                </strong>
              )}
              {scoreCase.periodLabel && <b className="text-[15px]">{scoreCase.periodLabel}</b>}
              {scoreCase.comment && (
                <p className="m-0 mt-3 text-[14px] leading-[1.7] opacity-80">{scoreCase.comment}</p>
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
