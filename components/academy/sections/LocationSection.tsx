import type { AcademyTenant, AcademyShuttleStop } from '@/lib/academy-data';
import { CopyAddressButton } from '@/components/academy/CopyAddressButton';

interface Props {
  tenant: AcademyTenant;
  shuttle: AcademyShuttleStop[];
  slug: string;
  eyebrow?: string;
  /** 지도가 없을 때 대신 보여 줄 사진 (건물·교실) */
  photo?: string | null;
}

export default function LocationSection({ tenant, shuttle, slug, photo = null, eyebrow = '오시는 길' }: Props) {
  const hasLocation = tenant.address || tenant.locationHeadline || tenant.naverMapEmbedUrl;
  if (!hasLocation) return null;
  const tel = tenant.phone?.replace(/[^0-9]/g, '');

  return (
    <section id="location" className="acad-section">
      <div className="acad-wrap">
        <div className="mb-6 md:mb-8">
          <p className="acad-eyebrow">{eyebrow}</p>
          <h2 className="acad-h2">{tenant.locationHeadline ?? '오시는 길'}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-6 items-stretch">
          {/* 정보 */}
          <div className="acad-card p-6 md:p-[30px] flex flex-col gap-2 min-w-0">
            <h3 className="m-0 mb-1 text-[18px] font-bold text-ink">{tenant.name}</h3>
            {tenant.address && <p className="m-0 text-[15px] text-ink leading-relaxed">{tenant.address}</p>}
            {tenant.transitInfo && <p className="m-0 text-[14px] text-body leading-relaxed whitespace-pre-line">{tenant.transitInfo}</p>}
            {tenant.parkingInfo && <p className="m-0 text-[14px] text-body leading-relaxed"><b className="text-ink">주차</b> {tenant.parkingInfo}</p>}
            {tenant.hours && <p className="m-0 text-[14px] text-body leading-relaxed whitespace-pre-line">{tenant.hours}</p>}
            {tenant.phone && <p className="m-0 text-[16px] font-bold text-ink">{tenant.phone}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {tel && (
                <a href={`tel:${tel}`} className="acad-btn h-11 px-[18px] text-[14px]">
                  전화 문의하기
                </a>
              )}
              {tenant.address && <CopyAddressButton address={tenant.address} />}
              {tenant.naverPlaceUrl && (
                <a href={tenant.naverPlaceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center h-11 px-4 rounded-[11px] border border-line bg-surface text-ink text-[14px] font-semibold no-underline">
                  네이버 지도로 길찾기
                </a>
              )}
            </div>
            <a href={`/${slug}/location`} className="acad-more mt-3 self-start">상세 오시는 길 보기 →</a>
          </div>

          {/* 지도 또는 사진 */}
          <div className="min-h-[220px] md:min-h-[300px] overflow-hidden bg-subtle flex items-center justify-center text-body text-[15px]" style={{ borderRadius: 'var(--card-radius)' }}>
            {tenant.naverMapEmbedUrl ? (
              <iframe src={tenant.naverMapEmbedUrl} className="w-full h-full min-h-[220px] md:min-h-[300px] border-0" allowFullScreen loading="lazy" title={`${tenant.name} 지도`} />
            ) : photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={`${tenant.name} 건물과 주변`} className="w-full h-full object-cover" />
            ) : (
              <span>지도 준비 중</span>
            )}
          </div>
        </div>

        {/* 셔틀 */}
        {shuttle.length > 0 && (
          <div className="acad-card mt-6 p-6 overflow-x-auto">
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
      </div>
    </section>
  );
}
