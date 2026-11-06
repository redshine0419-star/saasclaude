import type { AcademyClass } from '@/lib/academy-data';
import { TitleLines } from '@/components/academy/TitleLines';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  title?: string;
  eyebrow?: string;
  classes: AcademyClass[];
};

export default function CurriculumSection({ classes, eyebrow = 'CURRICULUM', title = SECTION_COPY_SPEC.curriculum.title }: Props) {
  if (classes.length === 0) return null;
  const time = (c: AcademyClass) => (c.startTime && c.endTime ? `${c.startTime}~${c.endTime}` : c.startTime ?? '');

  return (
    <section id="curriculum" className="acad-section">
      <div className="acad-wrap">
        <div className="mb-8 md:mb-[38px]">
          <p className="acad-eyebrow">{eyebrow}</p>
          <h2 className="acad-h2"><TitleLines text={title} /></h2>
        </div>

        <div className="overflow-x-auto border border-line rounded-[13px] bg-surface">
          <table className="w-full min-w-[650px] border-collapse text-[14px]">
            <thead>
              <tr className="text-left">
                {['학년', '수업명', '요일', '시간', '교재'].map((h) => (
                  <th key={h} className="px-5 py-[17px] bg-[#f0f3f9] text-[12px] font-bold text-[#52617b]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-5 py-[17px] font-bold">{c.gradeBand ?? ''}</td>
                  <td className="px-5 py-[17px]">
                    {c.name}
                    {c.seatsLeft === 0 && <span className="ml-2 text-[12px] font-semibold text-warn-ink">마감</span>}
                  </td>
                  <td className="px-5 py-[17px]">{c.days.join('·')}</td>
                  <td className="px-5 py-[17px]">{time(c)}</td>
                  <td className="px-5 py-[17px] text-body">{c.textbook ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
