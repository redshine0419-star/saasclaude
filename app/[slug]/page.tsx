import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';
import HeroSection from '@/components/academy/sections/HeroSection';
import QuickInfoSection from '@/components/academy/sections/QuickInfoSection';
import DirectorSection from '@/components/academy/sections/DirectorSection';
import ClassesSection from '@/components/academy/sections/ClassesSection';
import FeesSection from '@/components/academy/sections/FeesSection';
import ReviewsSection from '@/components/academy/sections/ReviewsSection';
import NewsSection from '@/components/academy/sections/NewsSection';
import ConsultFormSection from '@/components/academy/sections/ConsultFormSection';

const SECTION_ORDER = [
  'hero',
  'quick_info',
  'director',
  'classes',
  'fees',
  'reviews',
  'news',
  'consult_form',
] as const;

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const enabled = new Set(data.sections);

  function renderSection(key: string) {
    if (!enabled.has(key)) return null;
    switch (key) {
      case 'hero':
        return (
          <HeroSection
            key="hero"
            tenant={data!.tenant}
            directorPhoto={data!.director?.photo ?? null}
            levelTestSlots={data!.levelTestSlots}
          />
        );
      case 'quick_info':
        return <QuickInfoSection key="quick_info" tenant={data!.tenant} />;
      case 'director':
        return data!.director ? (
          <DirectorSection key="director" tenant={data!.tenant} director={data!.director} />
        ) : null;
      case 'classes':
        return <ClassesSection key="classes" classes={data!.classes} />;
      case 'fees':
        return (
          <FeesSection
            key="fees"
            tenant={data!.tenant}
            fees={data!.fees}
            extraCosts={data!.extraCosts}
          />
        );
      case 'reviews':
        return <ReviewsSection key="reviews" reviews={data!.reviews} />;
      case 'news':
        return <NewsSection key="news" posts={data!.posts} />;
      case 'consult_form':
        return (
          <ConsultFormSection
            key="consult_form"
            tenant={data!.tenant}
            slots={data!.levelTestSlots}
          />
        );
      default:
        return null;
    }
  }

  return (
    <>
      <SiteHeader name={data.tenant.name} phone={data.tenant.phone} kakaoChannelUrl={data.tenant.kakaoChannelUrl} />
      <main>
        {SECTION_ORDER.map(renderSection)}
      </main>
      <SiteFooter tenant={data.tenant} />
      <MobileBottomBar tenant={data.tenant} />
    </>
  );
}
