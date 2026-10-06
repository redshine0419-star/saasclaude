import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';

export default async function ConsultDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; time?: string; grade?: string; ref?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const { tenant } = data;
  const consultType = sp.type ?? '레벨테스트 예약';
  const time = sp.time ?? '';
  const grade = sp.grade ?? '';
  const ref = sp.ref ?? '';

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
        <section className="max-w-[720px] mx-auto px-5 pt-24 pb-20 flex flex-col items-center gap-6 text-center">
          {/* 체크 아이콘 */}
          <div className="w-20 h-20 rounded-full bg-accent text-on-accent flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 className="font-serif text-[32px] md:text-[44px] m-0">상담 신청이 접수되었습니다</h1>

          <p className="text-[18px] leading-[1.7] text-body m-0">
            입력하신 번호로 카카오톡 확인 메시지를 보냈습니다.<br />
            원장이 영업일 기준 하루 안에 직접 전화드릴게요.
          </p>

          {/* 신청 요약 */}
          <div className="w-full p-7 md:p-8 bg-white rounded-[16px] flex flex-col gap-4 text-left text-[16px]">
            {ref && (
              <div className="flex justify-between">
                <span className="text-body">접수 번호</span>
                <span className="font-semibold font-mono text-accent">{ref}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-body">상담 유형</span>
              <span className="font-semibold">{consultType}</span>
            </div>
            {time && (
              <div className="flex justify-between">
                <span className="text-body">희망 시간</span>
                <span className="font-semibold">{time}</span>
              </div>
            )}
            {grade && (
              <div className="flex justify-between">
                <span className="text-body">학생 학년</span>
                <span className="font-semibold">{grade}</span>
              </div>
            )}
          </div>

          {/* 준비물 안내 */}
          <div className="w-full p-5 md:p-6 rounded-[12px] text-[15px] leading-[1.7] text-left" style={{ background: '#FBF1CF', color: '#3E3510' }}>
            {consultType === '레벨테스트 예약' ? (
              <>
                <b>준비물 안내</b><br />
                레벨테스트 날에는 <b>필기구</b>와 <b>최근 시험지</b>(있다면)를 가져오시면 상담이 더 정확해집니다.
              </>
            ) : consultType === '방문 상담' ? (
              <>
                <b>방문 전 확인</b><br />
                학원 운영 시간 중 방문해 주세요. 학생 현재 교재나 성적표가 있으면 가져오시면 도움이 됩니다.
              </>
            ) : (
              <>
                <b>전화 상담 안내</b><br />
                원장이 등록하신 번호로 직접 연락드립니다. 편한 통화 가능 시간이 있으면 메시지로 미리 알려주세요.
              </>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <a
              href={`/${slug}`}
              className="h-[52px] px-6 rounded-[12px] border border-ink text-ink font-semibold flex items-center no-underline hover:bg-white transition-colors"
            >
              홈으로
            </a>
            <a
              href={`/${slug}/classes`}
              className="h-[52px] px-6 rounded-[12px] bg-accent text-on-accent font-bold flex items-center no-underline hover:opacity-90 transition-opacity"
            >
              수업 안내 둘러보기
            </a>
          </div>
        </section>
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
    </>
  );
}
