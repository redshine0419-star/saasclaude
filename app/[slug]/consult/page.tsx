import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import ConsultForm from '@/components/academy/ConsultForm';

export default async function ConsultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant, levelTestSlots } = data;

  return (
    <>
      <SiteHeader
        name={tenant.name}
        slug={slug}
        activePage="consult"
        phone={tenant.phone}
        kakaoChannelUrl={tenant.kakaoChannelUrl}
        address={tenant.address}
        hours={tenant.hours}
      />
      <main className="bg-bg min-h-screen">
        <section className="px-5 md:px-20 py-[72px] flex flex-col md:flex-row gap-10 md:gap-16">
          {/* 왼쪽: 소개 + 4단계 */}
          <div className="w-full md:w-[440px] flex-shrink-0 flex flex-col gap-8">
            <div className="flex flex-col gap-[14px]">
              <p className="text-[15px] font-bold text-accent m-0">상담 신청</p>
              <h1 className="font-serif text-[32px] md:text-[46px] leading-snug m-0">
                레벨테스트는 무료,<br />결과는 원장이<br />직접 설명합니다
              </h1>
            </div>

            <div className="flex flex-col gap-0">
              {[
                { n: '1', title: '신청', desc: '카카오톡으로 접수 확인 메시지가 갑니다', filled: true },
                { n: '2', title: '원장 연락', desc: '영업일 기준 하루 안에 전화드립니다', filled: false },
                { n: '3', title: '레벨테스트 (40분)', desc: '전날 카카오톡으로 시간을 다시 알려드립니다', filled: false },
                { n: '4', title: '결과 상담·반 추천', desc: '등록은 충분히 생각해보고 정하셔도 됩니다', filled: false },
              ].map((step, i) => (
                <div key={step.n} className={['flex gap-4', i < 3 ? 'pb-6' : ''].join(' ')}>
                  <div
                    className="w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-[15px]"
                    style={step.filled
                      ? { background: '#1E5645', color: '#FFFFFF' }
                      : { background: '#FFFFFF', border: '2px solid #1E5645', color: '#1E5645', boxSizing: 'border-box' }}
                  >
                    {step.n}
                  </div>
                  <div>
                    <div className="text-[17px] font-bold">{step.title}</div>
                    <div className="text-[15px] text-body mt-1">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 폼 */}
          <div className="flex-1">
            <ConsultForm slug={slug} slots={levelTestSlots} />
          </div>
        </section>
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
    </>
  );
}
