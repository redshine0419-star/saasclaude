import type { AcademyTenant, AcademyShuttleStop } from '@/lib/academy-data';
import { CopyAddressButton } from '@/components/academy/CopyAddressButton';

interface Props {
  tenant: AcademyTenant;
  shuttle: AcademyShuttleStop[];
  slug: string;
}

export default function LocationSection({ tenant, shuttle, slug }: Props) {
  const hasLocation = tenant.address || tenant.locationHeadline || tenant.naverMapEmbedUrl;
  if (!hasLocation) return null;

  return (
    <section className="px-5 md:px-20 py-16 bg-subtle">
      {/* 헤더 */}
      <div className="mb-8">
        <p className="text-[14px] font-bold text-accent mb-2">오시는 길</p>
        <h2 className="font-serif text-[28px] md:text-[36px] leading-snug m-0">
          {tenant.locationHeadline ?? (tenant.address ?? '오시는 길')}
        </h2>
      </div>

      {/* 지도 + 정보 */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-1 h-[240px] md:h-[380px] rounded-[20px] overflow-hidden bg-white flex items-center justify-center">
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

        <div className="md:w-[360px] p-7 bg-white rounded-[20px] flex flex-col gap-4 flex-shrink-0">
          {tenant.address && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-body">주소</span>
              <span className="text-[16px] font-semibold leading-snug">{tenant.address}</span>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {tenant.address && <CopyAddressButton address={tenant.address} />}
            {tenant.naverPlaceUrl && (
              <a
                href={tenant.naverPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-[8px] bg-accent text-on-accent text-[13px] font-semibold flex items-center no-underline"
              >
                네이버 지도로 길찾기
              </a>
            )}
          </div>
          {tenant.hours && (
            <div className="flex flex-col gap-1 pt-3 border-t border-line">
              <span className="text-[13px] text-body">운영 시간</span>
              <span className="text-[15px] leading-relaxed whitespace-pre-line">{tenant.hours}</span>
            </div>
          )}
          {tenant.phone && (
            <div className="flex flex-col gap-1 pt-3 border-t border-line">
              <span className="text-[13px] text-body">전화</span>
              <a href={`tel:${tenant.phone.replace(/-/g, '')}`} className="text-[17px] font-bold text-ink no-underline hover:text-accent">
                {tenant.phone}
              </a>
            </div>
          )}
          <div className="pt-3 border-t border-line">
            <a
              href={`/${slug}/location`}
              className="text-[13px] text-accent font-semibold no-underline hover:underline"
            >
              상세 오시는 길 보기 →
            </a>
          </div>
        </div>
      </div>

      {/* 대중교통 안내 */}
      {(tenant.transitInfo || tenant.parkingInfo) && (
        <div className="p-6 bg-white rounded-[16px]">
          <h3 className="text-[18px] font-bold mb-3 mt-0">대중교통·주차</h3>
          <div className="text-[15px] leading-[1.9] text-body whitespace-pre-line">
            {tenant.transitInfo}
            {tenant.parkingInfo && (
              <>
                {'\n'}
                <b>주차</b> {tenant.parkingInfo}
              </>
            )}
          </div>
        </div>
      )}

      {/* 셔틀 */}
      {shuttle.length > 0 && (
        <div className="mt-6 p-6 bg-white rounded-[16px]">
          <h3 className="text-[18px] font-bold mb-3 mt-0">셔틀 노선</h3>
          <table className="w-full border-collapse text-[14px]">
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
                  <td className="py-2.5">{s.stop}</td>
                  <td className="py-2.5">{s.pickup ?? '—'}</td>
                  <td className="py-2.5">{s.dropoff ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
