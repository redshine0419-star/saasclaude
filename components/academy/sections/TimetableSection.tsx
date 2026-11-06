import type { AcademyClass } from '@/lib/academy-data';
import { SECTION_COPY_SPEC } from '@/lib/section-copy';

type Props = {
  title?: string;
  classes: AcademyClass[];
  slug: string;
  /** 바로 위가 수업 안내 섹션이면 위 여백을 줄여 한 덩어리로 보이게 한다 */
  attached?: boolean;
};

const DAYS = ['월', '화', '수', '목', '금', '토'];
const DAY_NUMS = ['1', '2', '3', '4', '5', '6'];

function timeOf(cls: AcademyClass) {
  return cls.startTime ? `${cls.startTime}${cls.endTime ? `–${cls.endTime}` : ''}` : '';
}

export default function TimetableSection({ classes, slug, attached = false, title = SECTION_COPY_SPEC.timetable.title }: Props) {
  if (classes.length === 0) return null;

  const byDay: Record<string, AcademyClass[]> = {};
  for (const day of DAYS) byDay[day] = [];
  for (const cls of classes) {
    for (let i = 0; i < DAYS.length; i++) {
      if (cls.days.includes(DAYS[i]) || cls.days.includes(DAY_NUMS[i])) byDay[DAYS[i]].push(cls);
    }
  }
  for (const d of DAYS) byDay[d].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  const activeDays = DAYS.filter((d) => byDay[d].length > 0);
  if (activeDays.length === 0) return null;

  return (
    <section id="timetable" className={`${attached ? 'pt-0' : 'pt-14 md:pt-[76px]'} pb-14 md:pb-[76px]`}>
      <div className="acad-wrap">
        <div className="bg-surface border border-line rounded-[18px] p-3 md:p-[26px]">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-4 px-1 md:px-0">
            <div>
              <p className="acad-eyebrow">주간 시간표</p>
              <h3 className="m-0 text-[18px] md:text-[20px] font-bold text-ink">{title}</h3>
            </div>
            <a href={`/${slug}/classes`} className="acad-more">수업 안내 전체 보기 →</a>
          </div>

          {/* 데스크톱: 요일별 표 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr>
                  {activeDays.map((d) => (
                    <th key={d} className="p-3 font-semibold text-accent border-b-2 border-accent" style={{ width: `${100 / activeDays.length}%` }}>
                      {d}요일
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {activeDays.map((d) => (
                    <td key={d} className="p-3 align-top border-b border-line">
                      {byDay[d].map((cls) => (
                        <div key={cls.id} className="bg-bg rounded-[9px] p-2.5 mb-[7px] last:mb-0 min-w-[105px]">
                          <b className="block text-[13px] text-ink">{cls.name}</b>
                          <small className="text-body text-[12px]">
                            {timeOf(cls)}{cls.seatsLeft === 0 ? ' · 마감' : ''}
                          </small>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* 모바일: 요일별 목록 */}
          <div className="md:hidden flex flex-col gap-4 px-1 pb-1">
            {activeDays.map((d) => (
              <div key={d}>
                <div className="text-[13px] font-bold text-accent mb-2">{d}요일</div>
                <div className="flex flex-col gap-1.5">
                  {byDay[d].map((cls) => (
                    <div key={cls.id} className="px-3.5 py-3 bg-bg rounded-[10px] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[14px] text-ink">{cls.name}</div>
                        {timeOf(cls) && <div className="text-[13px] text-body">{timeOf(cls)}</div>}
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
      </div>
    </section>
  );
}
