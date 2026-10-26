import type { AcademyTenant } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC, type CopyItem } from '@/lib/section-copy';

type Props = {
  title?: string;
  items?: CopyItem[];
  tenant: AcademyTenant;
};


export default function ExamSystemSection({ tenant, title = SECTION_COPY_SPEC.exam_system.title, items = SECTION_COPY_SPEC.exam_system.items!.defaults }: Props) {
  const accent = tenant.accentColor ?? '#1D3FA8';

  return (
    <section id="system" className="px-5 md:px-20 pt-24 md:pt-[120px] flex flex-col gap-8">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-[15px] font-bold" style={{ color: accent }}>시험 대비 시스템</div>
          <h2 className="m-0 font-grotesk text-[28px] md:text-[40px] font-extrabold tracking-tight"><TitleLines text={title} /></h2>
        </div>

        <div className={`grid grid-cols-2 ${items.length >= 5 ? 'md:grid-cols-5' : items.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} border border-line rounded-[10px] overflow-hidden`}>
          {items.map((step, i) => {
            const isLast = i === items.length - 1;
            return (
              <div key={i}
                className={`p-5 md:p-6 flex flex-col gap-2 md:gap-3 ${i < items.length - 1 ? 'border-b md:border-b-0 md:border-r border-line' : ''} ${isLast ? 'bg-subtle' : ''}`}>
                <div className="font-grotesk text-[20px] md:text-[22px] font-extrabold" style={isLast ? { color: accent } : undefined}>
                  {step.code}
                </div>
                <div className="text-[15px] font-bold">{step.title}</div>
                <div className="text-[13px] md:text-[14px] leading-[1.7] text-body whitespace-pre-line">{step.body}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
