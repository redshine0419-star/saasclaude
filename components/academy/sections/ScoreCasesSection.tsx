import type { AcademyReview, AcademyTenant } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  tenant: AcademyTenant;
  reviews: AcademyReview[];
  /** 사례 카드 왼쪽 사진 (교실·공부 사진). 학생 얼굴 사진은 쓰지 않는다 */
  photos?: string[];
};

export default function ScoreCasesSection({ reviews, photos = [], eyebrow = 'STUDENT STORIES', title = SECTION_COPY_SPEC.score_cases.title }: Props) {
  const cases = reviews.filter((r) => r.kind === 'score_case');
  if (cases.length === 0) return null;

  return (
    <section className="acad-section bg-subtle">
      <div className="acad-wrap">
        <div className="mb-8 md:mb-[38px]">
          <p className="acad-eyebrow">{eyebrow}</p>
          <h2 className="acad-h2"><TitleLines text={title} /></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          {cases.map((c, i) => {
            const photo = photos.length ? photos[i % photos.length] : null;
            return (
              <article key={c.id} className={`grid ${photo ? 'grid-cols-[112px_1fr] sm:grid-cols-[145px_1fr]' : 'grid-cols-1'} border border-line rounded-[13px] overflow-hidden bg-surface`}>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="w-full h-full min-h-[170px] object-cover" />
                )}
                <div className="p-4 sm:p-[22px] min-w-0">
                  <span className="text-[12px] text-muted">{[c.authorLabel, c.periodLabel].filter(Boolean).join(' · ')}</span>
                  {c.beforeValue && c.afterValue && (
                    <div className="my-3 text-[21px] sm:text-[26px] font-black font-grotesk">
                      {c.beforeValue} → <em className="not-italic text-accent">{c.afterValue}</em>
                    </div>
                  )}
                  {c.comment && <p className="m-0 text-[13px] leading-[1.7] text-muted break-keep">{c.comment}</p>}
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-[18px] mb-0 text-[12px] text-muted">학생·학부모 서면 동의를 받은 사례만 게재합니다.</p>
      </div>
    </section>
  );
}
