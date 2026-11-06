import type { AcademyResultStat, AcademyTenant } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  tenant: AcademyTenant;
  resultStats: AcademyResultStat[];
  /** 왼쪽 사진 (교실). 없으면 카드만 */
  photo?: string | null;
};

export default function ResultsStatsSection({ tenant, resultStats, photo = null, eyebrow = 'PROVEN RESULTS', title = SECTION_COPY_SPEC.results_stats.title }: Props) {
  const stat = resultStats[0];
  if (!stat) return null;
  const cards = stat.metrics.slice(0, 4);

  return (
    <section id="results" className="acad-section">
      <div className="acad-wrap">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8 md:mb-[38px]">
          <div className="min-w-0">
            <p className="acad-eyebrow">{eyebrow}</p>
            <h2 className="acad-h2"><TitleLines text={title} /></h2>
          </div>
          <p className="acad-sub">{stat.termLabel}</p>
        </div>

        <div className={`grid grid-cols-1 gap-[14px] md:gap-7 ${photo ? 'md:grid-cols-[1.1fr_0.9fr]' : ''}`}>
          {photo && (
            <div className="h-[230px] md:h-[360px] rounded-[15px] overflow-hidden bg-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={`${tenant.name} 수업`} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <div className={`grid grid-cols-2 gap-2 md:gap-[13px] ${photo ? '' : 'md:grid-cols-4'}`}>
              {cards.map((m, i) => {
                const feature = i === Math.min(2, cards.length - 1);
                return (
                  <div
                    key={i}
                    className={`p-[17px] md:p-6 border rounded-[12px] ${feature ? 'bg-accent text-on-accent border-transparent' : 'bg-surface border-line'}`}
                  >
                    <span className={`text-[12px] ${feature ? 'opacity-85' : 'text-muted'}`}>{m.label}</span>
                    <b className="block mt-[14px] text-[27px] md:text-[34px] tracking-[-1px] font-black font-grotesk">
                      {m.value}<span className="text-[16px] md:text-[18px]">{m.unit}</span>
                    </b>
                  </div>
                );
              })}
            </div>
            {stat.basisText && <p className="mt-[18px] mb-0 text-[12px] text-muted leading-relaxed">{stat.basisText}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
