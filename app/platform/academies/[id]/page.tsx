import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PlatformSide } from '@/components/platform/PlatformSide';
import { AcademyEditClient } from './AcademyEditClient';

type Props = { params: Promise<{ id: string }> };

const ALL_SECTIONS = [
  { key: 'hero', label: '히어로', themes: ['warm', 'result', 'bright'] },
  { key: 'quick_info', label: '빠른 안내 (주소·전화)', themes: ['warm'] },
  { key: 'director', label: '원장 소개', themes: ['warm'] },
  { key: 'classes', label: '반·수업 정보', themes: ['warm', 'bright'] },
  { key: 'fees', label: '교습비', themes: ['warm', 'result'] },
  { key: 'reviews', label: '학부모 후기', themes: ['warm', 'bright'] },
  { key: 'news', label: '최신 소식', themes: ['warm'] },
  { key: 'results_stats', label: '성과 통계', themes: ['result'] },
  { key: 'exam_system', label: '시험 대비 시스템', themes: ['result'] },
  { key: 'curriculum', label: '커리큘럼', themes: ['result'] },
  { key: 'score_cases', label: '성적 사례', themes: ['result'] },
  { key: 'teachers', label: '강사 소개', themes: ['result'] },
  { key: 'day_flow', label: '하루 일과', themes: ['bright'] },
  { key: 'gallery', label: '갤러리', themes: ['bright'] },
  { key: 'safety', label: '안전·후기', themes: ['bright'] },
  { key: 'consult_form', label: '상담 신청 폼', themes: ['warm', 'result', 'bright'] },
];

export default async function AcademyEditPage({ params }: Props) {
  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!tenant) notFound();

  const sections = tenant.sections.map((s) => ({ key: s.sectionKey, enabled: s.enabled, sortOrder: s.sortOrder }));

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <PlatformSide active="academies" />
      <AcademyEditClient
        id={tenant.id}
        name={tenant.name}
        slug={tenant.slug}
        theme={tenant.theme}
        accentColor={tenant.accentColor ?? ''}
        subjects={tenant.subjects ?? ''}
        address={tenant.address ?? ''}
        phone={tenant.phone ?? ''}
        status={tenant.status}
        betaEndsAt={tenant.betaEndsAt?.toISOString() ?? null}
        sections={sections}
        allSections={ALL_SECTIONS}
      />
    </div>
  );
}
