import type { AcademyReview, AcademyShuttleStop } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC, type CopyItem } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  /** 원장이 입력한 항목만 — 기본 항목은 공개하지 않는다 */
  items?: CopyItem[];
  reviews: AcademyReview[];
  shuttle?: AcademyShuttleStop[];
};

const QUOTE_BG = ['var(--highlight-soft)', 'var(--pastel-pink)'];

export default function SafetySection({ reviews, shuttle = [], eyebrow = 'SAFE & CARE', title = SECTION_COPY_SPEC.safety.title, items = [] }: Props) {
  const reviewCards = reviews.filter((r) => r.kind === 'review').slice(0, 2);
  const hasPanel = items.length > 0 || shuttle.length > 0;
  if (!hasPanel && reviewCards.length === 0) return null;

  return (
    <section id="safe" className="acad-section">
      <div className="acad-wrap">
        <div className="mb-6 md:mb-9">
          <p className="acad-eyebrow">{eyebrow}</p>
          <h2 className="acad-h2"><TitleLines text={title} /></h2>
        </div>

        <div className={`grid grid-cols-1 gap-[22px] ${hasPanel && reviewCards.length > 0 ? 'md:grid-cols-[1.1fr_0.9fr]' : ''}`}>
          {hasPanel && (
            <div className="rounded-[30px] px-5 py-[25px] md:p-9" style={{ background: 'var(--accent-soft)' }}>
              {items.length > 0 && (
                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-6">
                  {items.map((item) => (
                    <div key={item.title} className="bg-surface rounded-[16px] p-[13px] md:p-[17px] text-[14px] min-w-0">
                      <strong className="block mb-1 text-ink">{item.title}</strong>
                      <span className="text-[12px] text-body">{item.body}</span>
                    </div>
                  ))}
                </div>
              )}
              {shuttle.length > 0 && (
                <>
                  <h3 className="m-0 mb-3 text-[17px] font-bold text-ink">셔틀 노선 안내</h3>
                  <div className="grid gap-2">
                    {shuttle.map((s) => (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-3 px-[15px] py-3 bg-surface rounded-[12px] text-[12px]">
                        <b className="text-[13px] text-ink">{s.stop}</b>
                        <span className="text-body sm:text-right">{[s.pickup && `승차 ${s.pickup}`, s.dropoff && `하차 ${s.dropoff}`].filter(Boolean).join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {reviewCards.length > 0 && (
            <div className="grid gap-4">
              {reviewCards.map((r, i) => (
                <div key={r.id} className="rounded-[26px] p-7 flex flex-col justify-between min-h-[180px]" style={{ background: QUOTE_BG[i % QUOTE_BG.length] }}>
                  <p className="m-0 mb-[18px] font-round text-[17px] md:text-[19px] leading-[1.7] text-ink break-keep">&ldquo;{r.body}&rdquo;</p>
                  <small className="text-body">{[r.authorLabel, r.source].filter(Boolean).join(' · ')}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
