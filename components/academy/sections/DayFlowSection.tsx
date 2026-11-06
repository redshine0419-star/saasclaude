import type { AcademyTenant } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC, type CopyItem } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  items?: CopyItem[];
  tenant: AcademyTenant;
};

const STEP_BG = ['var(--highlight-soft)', 'var(--pastel-sky)', 'var(--pastel-pink)', 'var(--pastel-mint, var(--accent-soft))'];

export default function DayFlowSection({ eyebrow = 'A HAPPY DAY', title = SECTION_COPY_SPEC.day_flow.title, items = SECTION_COPY_SPEC.day_flow.items!.defaults }: Props) {
  if (items.length === 0) return null;
  const cols = items.length >= 5 ? 'md:grid-cols-5' : items.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <section className="acad-section">
      <div className="acad-wrap">
        <div id="day" className="bg-subtle rounded-[24px] md:rounded-[34px] px-5 py-[27px] md:p-12">
          <div className="mb-6 md:mb-[30px]">
            <p className="acad-eyebrow">{eyebrow}</p>
            <h2 className="acad-h2"><TitleLines text={title} /></h2>
          </div>
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${cols} gap-[9px] md:gap-[13px]`}>
            {items.map((step, i) => {
              const isLast = i === items.length - 1;
              return (
                <div
                  key={i}
                  className={`p-[17px] md:px-[18px] md:py-[22px] rounded-[22px] min-h-[150px] md:min-h-[190px] ${isLast && items.length % 2 === 1 ? 'col-span-2 sm:col-span-1' : ''}`}
                  style={{ background: isLast ? 'var(--accent)' : STEP_BG[i % STEP_BG.length], color: isLast ? 'var(--on-accent)' : 'var(--ink)' }}
                >
                  <div className="w-[39px] h-[39px] rounded-full grid place-items-center font-extrabold mb-[17px] text-ink" style={{ background: 'rgba(255,255,255,.8)' }}>{i + 1}</div>
                  <h3 className="m-0 mb-2 text-[17px] font-bold">{step.title}</h3>
                  <p className="m-0 text-[13px] leading-[1.7] break-keep" style={{ color: isLast ? 'rgba(255,255,255,.85)' : 'var(--body)' }}>{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
