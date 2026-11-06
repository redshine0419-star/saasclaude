import type { AcademyTenant } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC, type CopyItem } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  items?: CopyItem[];
  tenant: AcademyTenant;
};

export default function ExamSystemSection({ eyebrow = 'EXAM STRATEGY', title = SECTION_COPY_SPEC.exam_system.title, items = SECTION_COPY_SPEC.exam_system.items!.defaults }: Props) {
  if (items.length === 0) return null;
  const cols = items.length >= 5 ? 'md:grid-cols-5' : items.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <section id="system" className="acad-section bg-subtle">
      <div className="acad-wrap">
        <div className="mb-8 md:mb-[38px]">
          <p className="acad-eyebrow">{eyebrow}</p>
          <h2 className="acad-h2"><TitleLines text={title} /></h2>
        </div>

        <div className={`grid grid-cols-2 ${cols} gap-px bg-line border border-line rounded-[14px] overflow-hidden`}>
          {items.map((step, i) => {
            const isLast = i === items.length - 1;
            return (
              <div
                key={i}
                className={`p-[17px] md:px-[19px] md:py-6 min-h-[155px] md:min-h-[190px] ${isLast ? 'bg-accent-soft' : 'bg-surface'} ${isLast && items.length % 2 === 1 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <b className="font-grotesk font-black text-[22px] text-accent">{step.code}</b>
                <h3 className="mt-[17px] mb-2 text-[15px] font-bold text-ink">{step.title}</h3>
                <p className="m-0 text-[12px] leading-[1.8] text-muted whitespace-pre-line break-keep">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
