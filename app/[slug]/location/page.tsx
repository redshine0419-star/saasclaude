import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant, shuttle } = data;

  return (
    <>
      <SiteHeader
        name={tenant.name}
        slug={slug}
        activePage="location"
        phone={tenant.phone}
        kakaoChannelUrl={tenant.kakaoChannelUrl}
        address={tenant.address}
        hours={tenant.hours}
      />
      <main className="bg-bg min-h-screen">
        {/* 페이지 헤더 */}
        <section className="px-5 md:px-20 pt-[72px] pb-10">
          <p className="text-[15px] font-bold text-accent mb-[14px]">오시는 길</p>
          <h1 className="font-serif text-[36px] md:text-[52px] leading-snug m-0">
            {tenant.locationHeadline ?? (tenant.address ?? '오시는 길')}
          </h1>
        </section>

        {/* 지도 + 정보 카드 */}
        <section className="px-5 md:px-20 pb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* 지도 */}
            <div className="flex-1 h-[280px] md:h-[480px] rounded-[20px] overflow-hidden bg-subtle flex items-center justify-center">
              {tenant.naverMapEmbedUrl ? (
                <iframe
                  src={tenant.naverMapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="지도"
                />
              ) : (
                <span className="text-body text-[15px]">지도 준비 중</span>
              )}
            </div>

            {/* 정보 카드 */}
            <div className="md:w-[420px] p-8 bg-white rounded-[20px] flex flex-col gap-5 flex-shrink-0">
              {tenant.address && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[14px] text-body">주소</span>
                  <span className="text-[18px] font-semibold leading-snug">{tenant.address}</span>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {tenant.address && (
                  <button
                    type="button"
                    className="h-11 px-4 rounded-[10px] border border-input-line bg-white text-[14px] font-medium"
                    onClick={undefined}
                  >
                    주소 복사
                  </button>
                )}
                {tenant.naverPlaceUrl && (
                  <a
                    href={tenant.naverPlaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 px-4 rounded-[10px] bg-accent text-on-accent text-[14px] font-semibold flex items-center no-underline"
                  >
                    네이버 지도로 길찾기
                  </a>
                )}
              </div>
              {tenant.hours && (
                <div className="flex flex-col gap-1.5 pt-4 border-t border-line">
                  <span className="text-[14px] text-body">운영 시간</span>
                  <span className="text-[16px] leading-relaxed whitespace-pre-line">{tenant.hours}</span>
                </div>
              )}
              {tenant.phone && (
                <div className="flex flex-col gap-1.5 pt-4 border-t border-line">
                  <span className="text-[14px] text-body">전화</span>
                  <a href={`tel:${tenant.phone.replace(/-/g, '')}`} className="text-[18px] font-bold text-ink no-underline hover:text-accent">
                    {tenant.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 대중교통·셔틀 */}
        <section className="px-5 md:px-20 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 교통 안내 */}
            <div className="p-8 bg-white rounded-[16px] flex flex-col gap-4">
              <h2 className="text-[22px] font-bold m-0">대중교통·주차</h2>
              <div className="text-[16px] leading-[1.9] text-body whitespace-pre-line">
                {tenant.transitInfo ?? '교통 정보를 입력해주세요.'}
                {tenant.parkingInfo && (
                  <>
                    {'\n'}
                    <b>주차</b> {tenant.parkingInfo}
                  </>
                )}
              </div>
            </div>

            {/* 셔틀 */}
            {shuttle.length > 0 && (
              <div className="p-8 bg-white rounded-[16px] flex flex-col gap-4">
                <h2 className="text-[22px] font-bold m-0">셔틀 노선</h2>
                <table className="w-full border-collapse text-[15px]">
                  <thead>
                    <tr className="text-left text-body">
                      <th className="pb-2 font-medium">정류장</th>
                      <th className="pb-2 font-medium">등원</th>
                      <th className="pb-2 font-medium">하원</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shuttle.map((s) => (
                      <tr key={s.id} className="border-t border-line">
                        <td className="py-3">{s.stop}</td>
                        <td className="py-3">{s.pickup ?? '—'}</td>
                        <td className="py-3">{s.dropoff ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter tenant={tenant} />
      <MobileBottomBar tenant={tenant} />
    </>
  );
}
