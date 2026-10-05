import { notFound } from 'next/navigation';
import { getAcademyPageData } from '@/lib/academy-data';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteHeaderResult from '@/components/academy/SiteHeaderResult';
import SiteHeaderBright from '@/components/academy/SiteHeaderBright';
import SiteFooter from '@/components/academy/SiteFooter';
import MobileBottomBar from '@/components/academy/MobileBottomBar';

// Theme A sections
import HeroSection from '@/components/academy/sections/HeroSection';
import QuickInfoSection from '@/components/academy/sections/QuickInfoSection';
import DirectorSection from '@/components/academy/sections/DirectorSection';
import ClassesSection from '@/components/academy/sections/ClassesSection';
import FeesSection from '@/components/academy/sections/FeesSection';
import ReviewsSection from '@/components/academy/sections/ReviewsSection';
import NewsSection from '@/components/academy/sections/NewsSection';
import ConsultFormSection from '@/components/academy/sections/ConsultFormSection';

// Theme B sections
import HeroSectionResult from '@/components/academy/sections/HeroSectionResult';
import ResultsStatsSection from '@/components/academy/sections/ResultsStatsSection';
import ExamSystemSection from '@/components/academy/sections/ExamSystemSection';
import CurriculumSection from '@/components/academy/sections/CurriculumSection';
import ScoreCasesSection from '@/components/academy/sections/ScoreCasesSection';
import TeachersSection from '@/components/academy/sections/TeachersSection';

// Theme C sections
import HeroSectionBright from '@/components/academy/sections/HeroSectionBright';
import DayFlowSection from '@/components/academy/sections/DayFlowSection';
import GallerySection from '@/components/academy/sections/GallerySection';
import SafetySection from '@/components/academy/sections/SafetySection';

const SECTION_ORDERS = {
  warm: ['hero', 'quick_info', 'director', 'classes', 'fees', 'reviews', 'news', 'consult_form'],
  result: ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'consult_form'],
  bright: ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'consult_form'],
} as const;

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const theme = data.tenant.theme as 'warm' | 'result' | 'bright';
  const sectionOrder = SECTION_ORDERS[theme] ?? SECTION_ORDERS.warm;
  const enabled = new Set(data.sections.length > 0 ? data.sections : sectionOrder);

  function renderSection(key: string) {
    if (!enabled.has(key)) return null;
    switch (key) {
      // ── Shared sections ──
      case 'hero':
        if (theme === 'result') {
          return (
            <HeroSectionResult
              key="hero"
              tenant={data!.tenant}
              resultStat={data!.resultStats[0] ?? null}
              levelTestSlots={data!.levelTestSlots}
            />
          );
        }
        if (theme === 'bright') {
          return (
            <HeroSectionBright
              key="hero"
              tenant={data!.tenant}
              classes={data!.classes}
              levelTestSlots={data!.levelTestSlots}
            />
          );
        }
        return (
          <HeroSection
            key="hero"
            tenant={data!.tenant}
            directorPhoto={data!.director?.photo ?? null}
            levelTestSlots={data!.levelTestSlots}
          />
        );

      case 'fees':
        return (
          <FeesSection
            key="fees"
            tenant={data!.tenant}
            fees={data!.fees}
            extraCosts={data!.extraCosts}
          />
        );

      case 'consult_form':
        return (
          <ConsultFormSection
            key="consult_form"
            tenant={data!.tenant}
            slots={data!.levelTestSlots}
          />
        );

      // ── Theme A sections ──
      case 'quick_info':
        return <QuickInfoSection key="quick_info" tenant={data!.tenant} />;
      case 'director':
        return data!.director ? (
          <DirectorSection key="director" tenant={data!.tenant} director={data!.director} />
        ) : null;
      case 'classes':
        return <ClassesSection key="classes" classes={data!.classes} />;
      case 'reviews':
        return <ReviewsSection key="reviews" reviews={data!.reviews} />;
      case 'news':
        return <NewsSection key="news" posts={data!.posts} />;

      // ── Theme B sections ──
      case 'results_stats':
        return (
          <ResultsStatsSection
            key="results_stats"
            tenant={data!.tenant}
            resultStats={data!.resultStats}
          />
        );
      case 'exam_system':
        return <ExamSystemSection key="exam_system" tenant={data!.tenant} />;
      case 'curriculum':
        return <CurriculumSection key="curriculum" classes={data!.classes} />;
      case 'score_cases':
        return (
          <ScoreCasesSection
            key="score_cases"
            tenant={data!.tenant}
            reviews={data!.reviews}
          />
        );
      case 'teachers':
        return (
          <TeachersSection
            key="teachers"
            tenant={data!.tenant}
            staff={data!.staff}
          />
        );

      // ── Theme C sections ──
      case 'day_flow':
        return <DayFlowSection key="day_flow" tenant={data!.tenant} />;
      case 'gallery':
        return <GallerySection key="gallery" posts={data!.posts} />;
      case 'safety':
        return <SafetySection key="safety" reviews={data!.reviews} />;

      default:
        return null;
    }
  }

  return (
    <>
      {theme === 'result' ? (
        <SiteHeaderResult
          name={data.tenant.name}
          slug={slug}
          phone={data.tenant.phone}
          kakaoChannelUrl={data.tenant.kakaoChannelUrl}
          accentColor={data.tenant.accentColor}
        />
      ) : theme === 'bright' ? (
        <SiteHeaderBright
          name={data.tenant.name}
          slug={slug}
          phone={data.tenant.phone}
          kakaoChannelUrl={data.tenant.kakaoChannelUrl}
        />
      ) : (
        <SiteHeader
          name={data.tenant.name}
          slug={slug}
          activePage="home"
          phone={data.tenant.phone}
          kakaoChannelUrl={data.tenant.kakaoChannelUrl}
          address={data.tenant.address}
          hours={data.tenant.hours}
        />
      )}
      <main>
        {sectionOrder.map(renderSection)}
      </main>
      <SiteFooter tenant={data.tenant} slug={slug} />
      <MobileBottomBar tenant={data.tenant} />
    </>
  );
}
