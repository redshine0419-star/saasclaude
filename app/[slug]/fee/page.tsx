import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

export default async function FeePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant, fees, extraCosts, refundPolicyText } = data;

  return (
    <>
      <SiteHeader
        name={tenant.name}
        slug={slug}
        activePage="fee"
        phone={tenant.phone}
        kakaoChannelUrl={tenant.kakaoChannelUrl}
        address={tenant.address}
        hours={tenant.hours}
      />
      <main className="bg-bg min-h-screen">
        {/* 페이지 헤더 */}
        <section className="px-5 md:px-20 pt-[72px] pb-10">
          <p className="text-[15px] font-bold text-accent mb-[14px]">교습비</p>
          <h1 className="font-serif text-[36px] md:text-[52px] leading-snug m-0">
            투명하게 공개합니다
          </h1>
        </section>

        {/* 교습비 테이블 */}
        {fees.length > 0 && (
          <section className="px-5 md:px-20 pb-12">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-[16px] overflow-hidden text-[15px]">
                <thead>
                  <tr style={{ background: '#1B2430', color: '#FFFFFF' }}>
                    <th className="p-4 text-left font-semibold">수업</th>
                    <th className="p-4 text-center font-semibold">주 횟수</th>
                    <th className="p-4 text-center font-semibold">월 수업 시간</th>
                    <th className="p-4 text-right font-semibold">교습비</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee, i) => (
                    <tr key={fee.id} className={i % 2 === 0 ? '' : 'bg-bg'}>
                      <td className="p-4 border-t border-line">
                        <div className="font-medium">{fee.label}</div>
                        {fee.note && <div className="text-[13px] text-body mt-0.5">{fee.note}</div>}
                      </td>
                      <td className="p-4 border-t border-line text-center text-body">
                        {fee.sessionsPerWeek ? `주 ${fee.sessionsPerWeek}회` : '—'}
                      </td>
                      <td className="p-4 border-t border-line text-center text-body">
                        {fee.monthlyHours ? `월 ${fee.monthlyHours}시간` : '—'}
                      </td>
                      <td className="p-4 border-t border-line text-right font-bold text-ink">
                        {formatKRW(fee.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[13px] text-body">
              * 교재비·재료비는 별도입니다. 문의: {tenant.phone ?? '원장에게 문의'}
            </p>
          </section>
        )}

        {/* 기타 비용 + 환불 규정 */}
        <section className="px-5 md:px-20 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {extraCosts.length > 0 && (
              <div className="p-8 bg-white rounded-[16px] flex flex-col gap-4">
                <h2 className="text-[20px] font-bold m-0">기타 비용</h2>
                <div className="flex flex-col gap-3">
                  {extraCosts.map((ec) => (
                    <div key={ec.id} className="flex justify-between items-start text-[15px]">
                      <div>
                        <span className="font-medium">{ec.label}</span>
                        {ec.note && <div className="text-[13px] text-body mt-0.5">{ec.note}</div>}
                      </div>
                      <span className="font-bold ml-4 flex-shrink-0">{formatKRW(ec.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="p-8 bg-white rounded-[16px] flex flex-col gap-4">
              <h2 className="text-[20px] font-bold m-0">환불 규정</h2>
              {refundPolicyText ? (
                <p className="text-[15px] text-body leading-relaxed m-0 whitespace-pre-line">{refundPolicyText}</p>
              ) : (
                <p className="text-[15px] text-body leading-relaxed m-0">
                  학원법 제18조에 따른 환불 규정을 적용합니다.<br />
                  자세한 사항은 원장에게 문의 주세요.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 흰색 CTA 카드 */}
        <section className="px-5 md:px-20 pb-20">
          <div className="rounded-[24px] bg-white p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-line">
            <div>
              <p className="text-[15px] text-body mb-2">궁금한 점이 있으신가요?</p>
              <h2 className="font-serif text-[28px] md:text-[34px] m-0">원장이 직접 설명드립니다</h2>
            </div>
            <a
              href={`/${slug}/consult`}
              className="flex-shrink-0 h-[56px] px-8 rounded-[12px] bg-accent text-on-accent font-bold text-[17px] flex items-center no-underline hover:opacity-90 transition-opacity"
            >
              무료 상담 신청
            </a>
          </div>
        </section>
      </main>
      <SiteFooter tenant={tenant} />
      <MobileBottomBar tenant={tenant} />
    </>
  );
}
