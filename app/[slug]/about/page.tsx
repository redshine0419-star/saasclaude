import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant, director, principles, facilities } = data;

  return (
    <>
      <SiteHeader
        name={tenant.name}
        slug={slug}
        activePage="about"
        phone={tenant.phone}
        kakaoChannelUrl={tenant.kakaoChannelUrl}
        address={tenant.address}
        hours={tenant.hours}
      />
      <main className="bg-bg min-h-screen">
        {/* 페이지 헤더 */}
        <section className="px-5 md:px-20 pt-[72px] pb-10">
          <p className="text-[15px] font-bold text-accent mb-[14px]">학원 소개</p>
          <h1 className="font-serif text-[36px] md:text-[52px] leading-snug m-0">
            {director?.headline ?? tenant.name}
          </h1>
        </section>

        {/* 원장 소개 */}
        {director && (
          <section className="px-5 md:px-20 pb-16">
            <div className="flex flex-col md:flex-row gap-10 md:gap-16">
              {director.photo && (
                <div className="w-full md:w-[360px] flex-shrink-0">
                  <img
                    src={director.photo}
                    alt="원장 사진"
                    className="w-full md:w-[360px] h-[260px] md:h-[480px] object-cover rounded-[20px]"
                  />
                </div>
              )}
              <div className="flex flex-col gap-6 justify-center">
                <div>
                  <p className="text-[14px] text-body mb-1">원장 선생님</p>
                  <h2 className="text-[28px] md:text-[36px] font-serif m-0">{director.name ?? '원장'}</h2>
                </div>
                {director.philosophy && (
                  <p className="font-serif text-[18px] md:text-[22px] leading-relaxed text-ink whitespace-pre-line">
                    "{director.philosophy}"
                  </p>
                )}
                <div className="flex flex-col gap-3 text-[15px] text-body">
                  {director.education && (
                    <div className="flex gap-3">
                      <span className="font-semibold text-ink w-[56px] flex-shrink-0">학력</span>
                      <span className="whitespace-pre-line">{director.education}</span>
                    </div>
                  )}
                  {director.career && (
                    <div className="flex gap-3">
                      <span className="font-semibold text-ink w-[56px] flex-shrink-0">경력</span>
                      <span className="whitespace-pre-line">{director.career}</span>
                    </div>
                  )}
                  {director.subjectsTaught && (
                    <div className="flex gap-3">
                      <span className="font-semibold text-ink w-[56px] flex-shrink-0">담당</span>
                      <span>{director.subjectsTaught}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 교육 철학 */}
        {principles.length > 0 && (
          <section className="px-5 md:px-20 py-16 bg-white">
            <h2 className="font-serif text-[28px] md:text-[36px] m-0 mb-8">교육 철학</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {principles.map((p) => (
                <div key={p.id} className="p-8 rounded-[16px] bg-bg flex flex-col gap-4">
                  <div className="w-9 h-9 rounded-full bg-accent text-on-accent flex items-center justify-center font-bold text-[15px]">
                    {p.number}
                  </div>
                  <h3 className="text-[18px] font-bold m-0">{p.title}</h3>
                  {p.description && <p className="text-[15px] text-body leading-relaxed m-0">{p.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 시설 안내 */}
        {facilities.length > 0 && (
          <section className="px-5 md:px-20 py-16">
            <h2 className="font-serif text-[28px] md:text-[36px] m-0 mb-8">시설 안내</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {facilities.map((f) => (
                <div key={f.id} className="rounded-[16px] overflow-hidden bg-white">
                  {f.photo ? (
                    <img src={f.photo} alt={f.label} className="w-full h-[200px] object-cover" />
                  ) : (
                    <div className="w-full h-[200px] bg-subtle flex items-center justify-center text-body text-[14px]">
                      사진 준비 중
                    </div>
                  )}
                  <div className="p-5 font-semibold text-[16px]">{f.label}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA 배너 */}
        <section className="px-5 md:px-20 py-16">
          <div className="rounded-[24px] bg-accent text-on-accent p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-[15px] opacity-80 mb-2">레벨테스트는 무료입니다</p>
              <h2 className="font-serif text-[28px] md:text-[36px] m-0">지금 바로 레벨테스트 예약하기</h2>
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
