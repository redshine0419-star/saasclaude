import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import { prisma } from '@/lib/prisma';
import ThemeHeader from '@/components/academy/ThemeHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import { isRegToken } from '@/lib/students/registration';
import JoinForm from './JoinForm';

type Props = { params: Promise<{ slug: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  // 개인 링크 — 검색에 나오지 않게 한다
  return { title: data ? `학생 등록 — ${data.tenant.name}` : '학생 등록', robots: { index: false, follow: false } };
}

export default async function JoinPage({ params }: Props) {
  const { slug, token } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();
  const { tenant } = data;

  const valid =
    isRegToken(token) &&
    !!(await prisma.tenant.findFirst({ where: { slug, status: 'active', studentRegToken: token }, select: { id: true } }));

  return (
    <>
      <ThemeHeader
        theme={tenant.theme ?? 'warm'}
        name={tenant.name}
        slug={slug}
        activePage="join"
        phone={tenant.phone}
        kakaoChannelUrl={tenant.kakaoChannelUrl}
        address={tenant.address}
        hours={tenant.hours}
        accentColor={tenant.accentColor}
      />
      <main className="bg-bg min-h-screen">
        <section className="px-5 md:px-20 py-12 md:py-[72px] max-w-[720px] mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-[15px] font-bold text-accent m-0">학생 등록</p>
            <h1 className="font-serif text-[28px] md:text-[38px] leading-snug m-0">{tenant.name} 원생 등록 정보를 알려 주세요</h1>
            <p className="text-[15px] text-body m-0 leading-relaxed">
              입력하신 내용은 학원에서 확인한 뒤 학생부에 등록됩니다. 수업 안내·출결·상담 연락에 쓰입니다.
            </p>
          </div>
          {valid ? (
            <JoinForm slug={slug} token={token} academyName={tenant.name} />
          ) : (
            <div className="p-6 md:p-10 bg-white rounded-[24px] text-[16px] leading-relaxed">
              만료되었거나 올바르지 않은 등록 링크입니다.<br />
              학원에 새 등록 링크를 요청해 주세요.{tenant.phone && <> (대표 전화 {tenant.phone})</>}
            </div>
          )}
        </section>
      </main>
      <SiteFooter tenant={tenant} slug={slug} />
    </>
  );
}
