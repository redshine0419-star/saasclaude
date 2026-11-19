import { JsonLd } from '@/components/seo/JsonLd';
import { SITE_URL, ORG_ID, breadcrumb, webPage } from '@/lib/seo/jsonld';
import { ConsultClient } from './ConsultClient';

const TITLE = '학원 홈페이지 무료 진단 — 모바일·검색·상담 신청 점검 | 더클';
const DESC = '지금 쓰는 학원 홈페이지·블로그 주소를 넣으면 모바일 화면, 검색 노출, 상담 신청 구조, 학원 정보 표기를 바로 점검해 드립니다. 무료입니다.';

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/consult` },
  openGraph: { type: 'website', url: `${SITE_URL}/consult`, title: TITLE, description: DESC, siteName: '더클', locale: 'ko_KR' },
};

const DIAGNOSIS_SERVICE = {
  '@type': 'Service',
  '@id': `${SITE_URL}/consult#service`,
  name: '학원 홈페이지 무료 진단',
  serviceType: '웹사이트 점검',
  description: DESC,
  provider: { '@id': ORG_ID },
  areaServed: { '@type': 'Country', name: '대한민국' },
  audience: { '@type': 'BusinessAudience', audienceType: '학원·교습소 원장' },
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'KRW' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: '점검 항목',
    itemListElement: ['모바일 화면', '검색 노출', '상담 신청 구조', '학원 정보 표기'].map((n) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n } })),
  },
};

export default function ConsultPage() {
  return (
    <>
      <JsonLd nodes={[webPage({ path: '/consult', name: TITLE, description: DESC, extra: { mainEntity: { '@id': `${SITE_URL}/consult#service` } } }), DIAGNOSIS_SERVICE, breadcrumb([{ name: '무료 진단', path: '/consult' }])]} />
      <ConsultClient />
    </>
  );
}
