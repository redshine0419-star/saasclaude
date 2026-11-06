import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAcademyPageData } from '@/lib/academy-data';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/academy/SiteHeader';
import SiteHeaderResult from '@/components/academy/SiteHeaderResult';
import SiteHeaderBright from '@/components/academy/SiteHeaderBright';
import SiteFooter from '@/components/academy/SiteFooter';

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
import { sectionItems, sectionTitle } from '@/lib/section-copy';
import DayFlowSection from '@/components/academy/sections/DayFlowSection';
import GallerySection from '@/components/academy/sections/GallerySection';
import SafetySection from '@/components/academy/sections/SafetySection';
import LocationSection from '@/components/academy/sections/LocationSection';
import PrinciplesSection from '@/components/academy/sections/PrinciplesSection';
import TimetableSection from '@/components/academy/sections/TimetableSection';
import FaqSection from '@/components/academy/sections/FaqSection';
import { DEFAULT_SECTION_ORDER, LOCKED_SECTIONS, isThemeKey, sectionEyebrow, type ThemeKey } from '@/lib/sections';


export default async function AcademyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) {
    // 원장이 잠시 비공개로 돌린 학원은 안내만 보여 준다
    const hidden = await prisma.tenant.findUnique({ where: { slug }, select: { name: true, phone: true, status: true, published: true } });
    if (!hidden || hidden.status !== 'active' || hidden.published) notFound();
    return (
      <main className="min-h-screen flex items-center justify-center px-5 bg-[#F6F3EC] text-[#1B2430]" style={{ fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
        <div className="max-w-[420px] text-center flex flex-col gap-3">
          <h1 className="m-0 text-[24px] font-bold">{hidden.name}</h1>
          <p className="m-0 text-[15px] leading-relaxed text-[#3E4652]">지금은 홈페이지를 잠시 쉬고 있습니다.{hidden.phone && <><br />문의: {hidden.phone}</>}</p>
        </div>
      </main>
    );
  }

  const isDemoSlug = ['demo-warm', 'demo-result', 'demo-bright'].includes(slug);

  const theme: ThemeKey = isThemeKey(data.tenant.theme) ? data.tenant.theme : 'warm';
  const allowed = DEFAULT_SECTION_ORDER[theme];
  // DB 설정(켜진 섹션만, 순서대로)을 따르되 현재 테마에 없는 섹션은 제외하고 잠금 섹션은 항상 포함
  const configured = data.sections.filter((k) => allowed.includes(k));
  const displayOrder: string[] = configured.length > 0 ? [...configured] : [...allowed];
  for (const key of allowed) {
    if (LOCKED_SECTIONS.has(key) && !displayOrder.includes(key)) {
      if (key === 'hero') displayOrder.unshift(key);
      else displayOrder.push(key);
    }
  }

  // 테마 A 섹션 사진: 메인 사진 2번째부터 → 교실·시설 사진 순서로 나눠 쓴다
  const photoPool = [...data.tenant.heroPhotos.slice(1), ...data.facilities.map((f) => f.photo).filter((p): p is string => !!p)];
  const sectionPhoto = (i: number) => photoPool[i] ?? photoPool[0] ?? null;
  const E = (k: string) => sectionEyebrow(theme, k);
  const renderedKeys = displayOrder.filter((k) => k !== 'classes' || data.classes.length > 0);

  const copy = data.tenant.sectionCopy;
  const T = (k: string) => sectionTitle(copy, k);

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
          <FeesSection title={T('fees')} eyebrow={E('fees')}
            key="fees"
            tenant={data!.tenant}
            fees={data!.fees}
            extraCosts={data!.extraCosts}
          />
        );

      case 'consult_form':
        return (
          <ConsultFormSection title={T('consult_form')} eyebrow={E('consult_form')}
            key="consult_form"
            tenant={data!.tenant}
            slots={data!.levelTestSlots}
          />
        );

      // ── Theme A sections ──
      case 'quick_info':
        return <QuickInfoSection key="quick_info" tenant={data!.tenant} classes={data!.classes} />;
      case 'director':
        return data!.director ? (
          <DirectorSection key="director" tenant={data!.tenant} director={data!.director} />
        ) : null;
      case 'classes':
        return data!.classes.length > 0 ? <ClassesSection title={T('classes')} eyebrow={E('classes')} key="classes" classes={data!.classes} slug={slug} look={theme === 'bright' ? 'detail' : 'photo'} /> : null;
      case 'reviews':
        return data!.reviews.filter((r) => r.kind === 'review').length > 0 ? (
          <ReviewsSection title={T('reviews')} eyebrow={E('reviews')} key="reviews" reviews={data!.reviews} slug={slug} photo={theme === 'warm' ? sectionPhoto(1) : null} />
        ) : null;
      case 'news':
        return data!.posts.length > 0 ? <NewsSection title={T('news')} key="news" posts={data!.posts} slug={slug} /> : null;

      // ── Theme B sections ──
      case 'results_stats':
        return data!.resultStats.length > 0 ? (
          <ResultsStatsSection title={T('results_stats')} eyebrow={E('results_stats')} photo={sectionPhoto(0)}
            key="results_stats"
            tenant={data!.tenant}
            resultStats={data!.resultStats}
          />
        ) : null;
      case 'exam_system':
        return <ExamSystemSection key="exam_system" tenant={data!.tenant} eyebrow={E('exam_system')} title={T('exam_system')} items={sectionItems(copy, 'exam_system')} />;
      case 'curriculum':
        return data!.classes.length > 0 ? <CurriculumSection title={T('curriculum')} eyebrow={E('curriculum')} key="curriculum" classes={data!.classes} /> : null;
      case 'score_cases': {
        const scoreCases = data!.reviews.filter((r) => r.kind === 'score_case');
        return scoreCases.length > 0 ? (
          <ScoreCasesSection title={T('score_cases')} eyebrow={E('score_cases')} photos={photoPool.slice(1)}
            key="score_cases"
            tenant={data!.tenant}
            reviews={data!.reviews}
          />
        ) : null;
      }
      case 'teachers':
        return data!.staff.length > 0 ? (
          <TeachersSection title={T('teachers')} eyebrow={E('teachers')}
            key="teachers"
            tenant={data!.tenant}
            staff={data!.staff}
          />
        ) : null;

      // ── Theme C sections ──
      case 'day_flow':
        return <DayFlowSection key="day_flow" tenant={data!.tenant} eyebrow={E('day_flow')} title={T('day_flow')} items={sectionItems(copy, 'day_flow')} />;
      case 'gallery':
        return data!.posts.length > 0 ? <GallerySection title={T('gallery')} eyebrow={E('gallery')} key="gallery" posts={data!.posts} slug={slug} /> : null;
      case 'safety':
        return <SafetySection key="safety" eyebrow={E('safety')} reviews={data!.reviews} shuttle={data!.shuttle} title={T('safety')} items={sectionItems(copy, 'safety')} />;

      case 'location':
        return <LocationSection key="location" tenant={data!.tenant} shuttle={theme === 'bright' ? [] : data!.shuttle} slug={slug} eyebrow={E('location')} photo={photoPool[photoPool.length - 1] ?? null} />;

      case 'principles':
        return data!.principles.length > 0 ? (
          <PrinciplesSection title={T('principles')} key="principles" principles={data!.principles} slug={slug} photo={sectionPhoto(0)} />
        ) : null;

      case 'timetable':
        return data!.classes.length > 0 ? (
          <TimetableSection title={T('timetable')} key="timetable" classes={data!.classes} slug={slug} attached={renderedKeys[renderedKeys.indexOf('timetable') - 1] === 'classes'} />
        ) : null;

      case 'faq':
        return data!.faqItems.length > 0 ? (
          <FaqSection key="faq" items={data!.faqItems} eyebrow={E('faq')} />
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
    </>
  );
}
