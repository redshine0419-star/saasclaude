import type { AcademyTenant } from '@/lib/academy-data';
import { ldJson, SITE_URL } from '@/lib/seo/jsonld';

type Props = {
  tenant: AcademyTenant;
};

export const academyUrl = (slug: string) => `${SITE_URL}/${slug}`;
export const academyOrgId = (slug: string) => `${academyUrl(slug)}#academy`;

/** 학원 홈페이지 공통 — 학원(교육기관·지역 업체) 정보 */
export default function JsonLd({ tenant }: Props) {
  const schema = {
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': academyOrgId(tenant.slug),
    name: tenant.name,
    url: academyUrl(tenant.slug),
    ...(tenant.address && { address: { '@type': 'PostalAddress', streetAddress: tenant.address, addressCountry: 'KR' } }),
    ...(tenant.phone && { telephone: tenant.phone }),
    ...(tenant.hours && { openingHours: tenant.hours }),
    ...(tenant.subjects && { knowsAbout: tenant.subjects }),
    ...(tenant.targetGrades && { audience: { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: tenant.targetGrades } }),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(schema) }} />;
}

/**
 * 학원 소식 글 — 원장님이 글을 올리면 화면에서 자동으로 만들어진다(따로 입력할 것 없음).
 */
export function PostJsonLd({ tenant, post }: { tenant: Pick<AcademyTenant, 'slug' | 'name'>; post: { id: string; title: string; body?: string | null; imageUrl?: string | null; publishedAt?: Date | string | null; category?: string | null } }) {
  const url = `${academyUrl(tenant.slug)}/news/${post.id}`;
  const text = (post.body ?? '').replace(/\s+/g, ' ').trim();
  const published = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
  const image = post.imageUrl ? (/^https?:\/\//.test(post.imageUrl) ? post.imageUrl : `${SITE_URL}${post.imageUrl}`) : undefined;
  const nodes = [
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: post.title.slice(0, 110),
      url,
      mainEntityOfPage: url,
      inLanguage: 'ko-KR',
      ...(text && { description: text.slice(0, 150), wordCount: text.replace(/\s/g, '').length }),
      ...(published && { datePublished: published, dateModified: published }),
      ...(image && { image }),
      ...(post.category && { articleSection: { notice: '공지', recruit: '특강 모집', exam: '시험 대비', gallery: '갤러리' }[post.category] ?? post.category }),
      author: { '@id': academyOrgId(tenant.slug) },
      publisher: { '@id': academyOrgId(tenant.slug) },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: tenant.name, item: academyUrl(tenant.slug) },
        { '@type': 'ListItem', position: 2, name: '소식', item: `${academyUrl(tenant.slug)}/news` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(nodes) }} />;
}
