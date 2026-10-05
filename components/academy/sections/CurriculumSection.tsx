import type { AcademyClass } from '@/lib/academy-data';

type Props = {
  classes: AcademyClass[];
};

export default function CurriculumSection({ classes }: Props) {
  if (classes.length === 0) return null;

  // Group classes by gradeBand
  const byGrade = classes.reduce<Record<string, AcademyClass[]>>((acc, c) => {
    const band = c.gradeBand ?? '기타';
    if (!acc[band]) acc[band] = [];
    acc[band].push(c);
    return acc;
  }, {});

  const grades = Object.keys(byGrade);
  if (grades.length === 0) return null;

  return (
    <section id="curriculum" className="px-5 md:px-20 pt-24 md:pt-[120px] flex flex-col gap-8">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <h2 className="m-0 font-grotesk text-[28px] md:text-[40px] font-extrabold tracking-tight">학년별 커리큘럼</h2>

        {/* Desktop table */}
        <div className="hidden md:block border border-line rounded-[10px] overflow-hidden">
          <table className="w-full border-collapse text-[15px] table-fixed">
            <thead>
              <tr className="bg-subtle text-left">
                <th className="px-5 py-4 w-[120px] font-semibold">학년</th>
                <th className="px-5 py-4 font-semibold">수업명</th>
                <th className="px-5 py-4 font-semibold">요일</th>
                <th className="px-5 py-4 font-semibold">시간</th>
                <th className="px-5 py-4 font-semibold">교재</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c, i) => (
                <tr key={c.id} className={i > 0 ? 'border-t border-line' : ''}>
                  <td className="px-5 py-[18px] font-bold">{c.gradeBand ?? ''}</td>
                  <td className="px-5 py-[18px]">{c.name}</td>
                  <td className="px-5 py-[18px]">{c.days.join('·')}</td>
                  <td className="px-5 py-[18px]">{c.startTime && c.endTime ? `${c.startTime}~${c.endTime}` : ''}</td>
                  <td className="px-5 py-[18px] text-body">{c.textbook ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: grade group cards */}
        <div className="md:hidden flex flex-col gap-4">
          {grades.map((grade) => (
            <div key={grade} className="border border-line rounded-xl overflow-hidden">
              <div className="bg-subtle px-4 py-3 font-bold text-[15px]">{grade}</div>
              {byGrade[grade].map((c) => (
                <div key={c.id} className="px-4 py-3 border-t border-line">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-[13px] text-body mt-1">{c.days.join('·')} {c.startTime && c.endTime ? `${c.startTime}~${c.endTime}` : ''}</div>
                  {c.textbook && <div className="text-[13px] text-muted mt-1">{c.textbook}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
