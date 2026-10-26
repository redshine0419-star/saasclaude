import type { AcademyTenant } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC, type CopyItem } from '@/lib/section-copy';

type Props = {
  title?: string;
  items?: CopyItem[];
  tenant: AcademyTenant;
};

const STEP_COLORS = ['#FFF3C4', '#DDF1FF', '#FFE3EC', '#E0F5EF', '#EDE7FB'];


export default function DayFlowSection({ tenant, title = SECTION_COPY_SPEC.day_flow.title, items = SECTION_COPY_SPEC.day_flow.items!.defaults }: Props) {
  const accent = tenant.accentColor ?? '#0F766E';

  return (
    <section id="day" className="mx-5 md:mx-16 mt-24 md:mt-28 p-10 md:p-14 rounded-[32px] md:rounded-[40px] bg-subtle flex flex-col gap-8">
      <h2 className="m-0 font-round text-[32px] md:text-[42px] text-ink"><TitleLines text={title} /></h2>

      <div className={`grid grid-cols-2 gap-3 md:gap-4 ${items.length >= 5 ? 'md:grid-cols-5' : items.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        {items.map((step, i) => {
          const isLast = i === items.length - 1;
          const bg = isLast ? accent : STEP_COLORS[i % STEP_COLORS.length];
          const textColor = isLast ? '#FFFFFF' : '#1F2A37';
          const numBg = isLast ? '#FFFFFF' : bg;
          const numColor = isLast ? '#1F2A37' : '#1F2A37';

          return (
            <div key={i} className="p-5 md:p-6 rounded-[20px] md:rounded-[24px] flex flex-col gap-3"
              style={{ background: bg, color: textColor }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-round text-[22px]"
                style={{ background: numBg, color: numColor }}>
                {i + 1}
              </div>
              <div className="text-[16px] md:text-[17px] font-bold">{step.title}</div>
              <div className="text-[13px] md:text-[14px] leading-[1.65]" style={{ color: isLast ? 'rgba(255,255,255,0.85)' : '#3A4656' }}>
                {step.body}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
