import { notFound } from 'next/navigation';
import Link from 'next/link';
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
import LocationSection from '@/components/academy/sections/LocationSection';
import PrinciplesSection from '@/components/academy/sections/PrinciplesSection';
import TimetableSection from '@/components/academy/sections/TimetableSection';
import FaqSection from '@/components/academy/sections/FaqSection';

const SECTION_ORDERS = {
  warm: ['hero', 'quick_info', 'director', 'principles', 'classes', 'timetable', 'fees', 'reviews', 'news', 'consult_form', 'location'],
  result: ['hero', 'results_stats', 'exam_system', 'curriculum', 'score_cases', 'teachers', 'fees', 'consult_form'],
  bright: ['hero', 'day_flow', 'classes', 'gallery', 'safety', 'reviews', 'consult_form'],
} as const;

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) notFound();

  const isDemoSlug = ['demo-warm', 'demo-result', 'demo-bright'].includes(slug);

  const theme = data.tenant.theme as 'warm' | 'result' | 'bright';
  const defaultOrder = SECTION_ORDERS[theme] ?? SECTION_ORDERS.warm;
  // DB sections take priority (includes only enabled=true, sorted by sortOrder).
  // Fall back to hardcoded theme default when no per-tenant config exists.
  const displayOrder: string[] = data.sections.length > 0 ? data.sections : [...defaultOrder];

  function renderSection(key: string) {
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
        return data!.classes.length > 0 ? <ClassesSection key="classes" classes={data!.classes} /> : null;
      case 'reviews':
        return data!.reviews.filter((r) => r.kind === 'review').length > 0 ? (
          <ReviewsSection key="reviews" reviews={data!.reviews} />
        ) : null;
      case 'news':
        return data!.posts.length > 0 ? <NewsSection key="news" posts={data!.posts} slug={slug} /> : null;

      // ── Theme B sections ──
      case 'results_stats':
        return data!.resultStats.length > 0 ? (
          <ResultsStatsSection
            key="results_stats"
            tenant={data!.tenant}
            resultStats={data!.resultStats}
          />
        ) : null;
      case 'exam_system':
        return <ExamSystemSection key="exam_system" tenant={data!.tenant} />;
      case 'curriculum':
        return data!.classes.length > 0 ? <CurriculumSection key="curriculum" classes={data!.classes} /> : null;
      case 'score_cases': {
        const scoreCases = data!.reviews.filter((r) => r.kind === 'score_case');
        return scoreCases.length > 0 ? (
          <ScoreCasesSection
            key="score_cases"
            tenant={data!.tenant}
            reviews={data!.reviews}
          />
        ) : null;
      }
      case 'teachers':
        return data!.staff.length > 0 ? (
          <TeachersSection
            key="teachers"
            tenant={data!.tenant}
            staff={data!.staff}
          />
        ) : null;

      // ── Theme C sections ──
      case 'day_flow':
        return <DayFlowSection key="day_flow" tenant={data!.tenant} />;
      case 'gallery':
        return data!.posts.length > 0 ? <GallerySection key="gallery" posts={data!.posts} slug={slug} /> : null;
      case 'safety':
        return <SafetySection key="safety" reviews={data!.reviews} shuttle={data!.shuttle} />;

      case 'location':
        return <LocationSection key="location" tenant={data!.tenant} shuttle={data!.shuttle} slug={slug} />;

      case 'principles':
        return data!.principles.length > 0 ? (
          <PrinciplesSection key="principles" principles={data!.principles} slug={slug} />
        ) : null;

      case 'timetable':
        return data!.classes.length > 0 ? (
          <TimetableSection key="timetable" classes={data!.classes} slug={slug} />
        ) : null;

      case 'faq':
        return data!.faqItems.length > 0 ? (
          <FaqSection
            key="faq"
            items={data!.faqItems}
            accentColor={data!.tenant.accentColor ?? '#1E5645'}
          />
        ) : null;

      default:
        return null;
    }
  }

  return (
    <>
      {isDemoSlug && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
          <Link
            href={`/${slug}/admin`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'rgba(20,33,61,0.9)', color: '#FFFFFF',
              textDecoration: 'none', fontSize: 13, fontWeight: 600,
              backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            관리자 데모
          </Link>
        </div>
      )}
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
        {displayOrder.map(renderSection)}
      </main>
      <SiteFooter tenant={data.tenant} slug={slug} />
      <MobileBottomBar tenant={data.tenant} slug={slug} />
    </>
  );
}
