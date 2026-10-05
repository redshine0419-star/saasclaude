import type { AcademyClass } from '@/lib/academy-data';

type Props = {
  classes: AcademyClass[];
  slug: string;
};

const DAYS = ['월', '화', '수', '목', '금', '토'];
const DAY_NUMS = ['1', '2', '3', '4', '5', '6'];

export default function TimetableSection({ classes, slug }: Props) {
  if (classes.length === 0) return null;

  // Group classes by day for a column-based view
  const byDay: Record<string, AcademyClass[]> = {};
  for (const day of DAYS) byDay[day] = [];
  for (const cls of classes) {
    for (let i = 0; i < DAYS.length; i++) {
      if (cls.days.includes(DAYS[i]) || cls.days.includes(DAY_NUMS[i])) {
        byDay[DAYS[i]].push(cls);
      }
    }
  }
  const activeDays = DAYS.filter((d) => byDay[d].length > 0);
  if (activeDays.length === 0) return null;

  return (
    <section className="px-5 md:px-20 py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto">
        <p className="text-[15px] font-bold text-accent mb-3">주간 시간표</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <h2 className="font-serif text-[28px] md:text-[38px] leading-snug m-0">
            요일별 수업 편성
          </h2>
          <a
            href={`/${slug}/classes`}
            className="text-[14px] text-body hover:text-ink transition-colors no-underline flex-shrink-0"
          >
            수업 안내 전체 보기 →
          </a>
        </div>

        {/* Desktop: grid table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr>
                {activeDays.map((d) => (
                  <th
                    key={d}
                    className="py-3 px-4 text-center font-semibold text-accent bg-white border-b-2 border-accent"
                    style={{ width: `${100 / activeDays.length}%` }}
                  >
                    {d}요일
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {activeDays.map((d) => (
                  <td key={d} className="px-3 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      {byDay[d].map((cls) => (
                        <div
                          key={cls.id}
                          className="p-3 bg-bg rounded-[10px] flex flex-col gap-1"
                        >
                          <span className="font-semibold text-[14px] text-ink">{cls.name}</span>
                          {(cls.startTime || cls.endTime) && (
                            <span className="text-[12px] text-body">
                              {cls.startTime}{cls.endTime ? `–${cls.endTime}` : ''}
                            </span>
                          )}
                          {cls.seatsLeft === 0 && (
                            <span className="text-[11px] font-semibold text-warn-ink">마감</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile: day-by-day list */}
        <div className="md:hidden flex flex-col gap-4">
          {activeDays.map((d) => (
            <div key={d}>
              <div className="text-[13px] font-bold text-accent mb-2">{d}요일</div>
              <div className="flex flex-col gap-2">
                {byDay[d].map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 bg-white rounded-[12px] flex items-center justify-between gap-3 border border-line"
                  >
                    <div>
                      <div className="font-semibold text-[15px]">{cls.name}</div>
                      {(cls.startTime || cls.endTime) && (
                        <div className="text-[13px] text-body">
                          {cls.startTime}{cls.endTime ? `–${cls.endTime}` : ''}
                        </div>
                      )}
                    </div>
                    {cls.seatsLeft === 0 ? (
                      <span className="text-[12px] font-semibold text-warn-ink flex-shrink-0">마감</span>
                    ) : cls.seatsLeft !== null && cls.seatsLeft <= 3 ? (
                      <span className="text-[12px] font-semibold text-accent flex-shrink-0">잔여 {cls.seatsLeft}석</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
