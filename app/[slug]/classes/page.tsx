import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant, classes } = data;

  const gradeBands = Array.from(new Set(classes.map((c) => c.gradeBand ?? '기타')));

  return (
    <>
      <SiteHeader
        name={tenant.name}
        slug={slug}
        activePage="classes"
        phone={tenant.phone}
        kakaoChannelUrl={tenant.kakaoChannelUrl}
        address={tenant.address}
        hours={tenant.hours}
      />
      <main className="bg-bg min-h-screen">
        {/* 페이지 헤더 */}
        <section className="px-5 md:px-20 pt-[72px] pb-10">
          <p className="text-[15px] font-bold text-accent mb-[14px]">수업 안내</p>
          <h1 className="font-serif text-[36px] md:text-[52px] leading-snug m-0">
            {tenant.name}의 수업을 소개합니다
          </h1>
        </section>

        {/* 학년별 점프 내비 */}
        {gradeBands.length > 1 && (
          <div className="px-5 md:px-20 pb-8 flex gap-2 flex-wrap">
            {gradeBands.map((band) => (
              <a
                key={band}
                href={`#band-${band}`}
                className="h-[40px] px-5 rounded-full border border-input-line text-[14px] font-medium text-ink no-underline hover:bg-white transition-colors"
              >
                {band}
              </a>
            ))}
          </div>
        )}

        {/* 수업 카드 */}
        {gradeBands.map((band) => {
          const bandClasses = classes.filter((c) => (c.gradeBand ?? '기타') === band);
          return (
            <section key={band} id={`band-${band}`} className="px-5 md:px-20 pb-16">
              <h2 className="font-serif text-[28px] md:text-[32px] m-0 mb-6">{band}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {bandClasses.map((cls) => (
                  <div key={cls.id} className="p-6 md:p-8 bg-white rounded-[20px] flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-[20px] font-bold m-0">{cls.name}</h3>
                      {cls.seatsLeft !== null && cls.seatsLeft <= 3 && (
                        <span className="flex-shrink-0 h-6 px-2 rounded-full bg-[#FBF1CF] text-[#7A6A10] text-[12px] font-semibold flex items-center">
                          잔여 {cls.seatsLeft}석
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[14px]">
                      {cls.days.length > 0 && (
                        <span className="h-7 px-3 bg-bg rounded-full text-body flex items-center">
                          {cls.days.map((d) => (typeof d === 'number' ? WEEKDAYS[d] : d)).join('·')}
                          {cls.startTime && ` ${cls.startTime}`}
                          {cls.endTime && `–${cls.endTime}`}
                        </span>
                      )}
                      {cls.textbook && (
                        <span className="h-7 px-3 bg-bg rounded-full text-body flex items-center">{cls.textbook}</span>
                      )}
                    </div>
                    {cls.description && (
                      <p className="text-[15px] text-body leading-relaxed m-0">{cls.description}</p>
                    )}
                    {cls.seatsLeft !== null && cls.capacity !== null && (
                      <div className="flex items-center gap-2 text-[13px] text-body">
                        <div className="flex-1 h-1.5 bg-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${Math.round(((cls.capacity - cls.seatsLeft) / cls.capacity) * 100)}%` }}
                          />
                        </div>
                        <span>총 {cls.capacity}명 중 {cls.capacity - cls.seatsLeft}명 등록</span>
                      </div>
                    )}
                    {cls.seatsLeft === 0 ? (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] text-warn-ink font-semibold m-0">
                          마감 {cls.waitlistCount > 0 ? `· 대기 ${cls.waitlistCount}명` : ''}
                        </p>
                        <a
                          href={`/${slug}/consult?class=${encodeURIComponent(cls.name)}&waitlist=1`}
                          className="flex-shrink-0 h-8 px-4 rounded-full bg-warn-bg text-warn-ink text-[13px] font-semibold flex items-center no-underline hover:opacity-80 transition-opacity"
                        >
                          대기 신청
                        </a>
                      </div>
                    ) : cls.waitlistCount > 0 ? (
                      <p className="text-[13px] text-body m-0">대기 {cls.waitlistCount}명</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* 주간 시간표 */}
        {classes.length > 0 && (
          <section className="px-5 md:px-20 pb-16">
            <h2 className="font-serif text-[28px] md:text-[32px] m-0 mb-6">주간 시간표</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-[16px] overflow-hidden text-[14px] md:text-[15px]">
                <thead>
                  <tr className="bg-accent text-on-accent">
                    <th className="p-3 md:p-4 text-left font-semibold">수업명</th>
                    {['월', '화', '수', '목', '금', '토'].map((d) => (
                      <th key={d} className="p-3 md:p-4 text-center font-semibold">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls, i) => (
                    <tr key={cls.id} className={i % 2 === 0 ? '' : 'bg-bg'}>
                      <td className="p-3 md:p-4 font-medium border-t border-line">
                        <div>{cls.name}</div>
                        {cls.startTime && (
                          <div className="text-[12px] text-body">{cls.startTime}{cls.endTime && `–${cls.endTime}`}</div>
                        )}
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((wd) => (
                        <td key={wd} className="p-3 md:p-4 text-center border-t border-line">
                          {cls.days.includes(String(wd)) || cls.days.includes(WEEKDAYS[wd]) ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* CTA 배너 */}
        <section className="px-5 md:px-20 py-16">
          <div className="rounded-[24px] bg-accent text-on-accent p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-[15px] opacity-80 mb-2">레벨테스트는 무료입니다</p>
              <h2 className="font-serif text-[28px] md:text-[36px] m-0">우리 아이에게 맞는 반을 찾아드립니다</h2>
            </div>
            <a
              href={`/${slug}/consult`}
              className="flex-shrink-0 h-[56px] px-8 rounded-[12px] bg-white text-accent font-bold text-[17px] flex items-center no-underline hover:opacity-90 transition-opacity"
            >
              무료 신청하기
            </a>
          </div>
        </section>
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
      <MobileBottomBar tenant={tenant} />
    </>
  );
}
