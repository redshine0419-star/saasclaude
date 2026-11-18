/**
 * 더클 서비스 사이트 구조화 데이터(JSON-LD)와 GEO(AI 검색)용 사실 문장.
 * 페이지마다 @graph 하나로 넣고, 회사(#org)·사이트(#website)·서비스(#software)는 @id로 서로 잇는다.
 * 사실 문장은 화면(메인 FAQ)·JSON-LD·/llms.txt가 같은 값을 쓴다 — 기능·요금이 바뀌면 여기만 고친다.
 */
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { OPERATOR } from '@/lib/legal/documents';
import { ORG_ID, SITE_URL, SOFTWARE_ID, WEBSITE_ID, LOGO_URL, abs, type QA } from './core';

export * from './core';


/** 한 문장 정의 — AI가 "더클이 뭐야?"에 그대로 인용하기 좋게 */
export const SERVICE_DEFINITION =
  `${BRAND_NAME}은 동네 학원·교습소 원장님을 위한 홈페이지 제작·관리 서비스입니다. 학원 홈페이지, 상담 신청 관리, 온라인 레벨테스트, 학생부·출결, 학부모 리포트를 한곳에서 관리합니다.`;

export const SERVICE_FEATURES = [
  '학원 홈페이지 제작 및 관리 (3가지 테마, 휴대폰에서 직접 수정)',
  '상담 신청 및 관리 (레벨테스트 예약, 새 상담 앱 알림, 등록까지 단계별 관리)',
  '학부모 안내 문자 준비 (접수 확인·테스트 전날·상담 후 안내를 원장님 휴대폰 문자로)',
  '온라인 레벨테스트 (문제은행·시험지, 자동 채점, 서술형 첨삭, 단원별 결과지)',
  '학생부·출결·성적과 학부모 리포트 링크 공유',
  '소식·후기·성적 사례·자료실 콘텐츠 관리',
  '월간 리포트 (상담 신청·등록·유입 경로)',
  '직원(실장님) 초대와 설치형 관리자 앱',
  '검색엔진·AI 검색에 잘 읽히는 홈페이지 구조 (구조화 데이터·FAQ)',
];

export const AUDIENCE = '수학·영어·국어·과학 등 보습학원, 예체능 학원, 공부방·교습소를 운영하는 원장님';


/** 메인 '자주 묻는 질문' — 화면과 FAQPage JSON-LD가 같은 글을 쓴다 */
export function homeFaq(prices: { standard: number; plus: number }): QA[] {
  const won = (n: number) => `월 ${n.toLocaleString('ko-KR')}원`;
  return [
    { q: `${BRAND_NAME}은 무엇인가요?`, a: SERVICE_DEFINITION },
    { q: '누가 쓰나요?', a: `${AUDIENCE}이 씁니다. 홈페이지 업체에 맡기지 않고 원장님이 휴대폰으로 직접 고칠 수 있게 만들었습니다.` },
    { q: '요금은 얼마인가요?', a: `베타 기간에는 홈페이지 오픈일부터 3개월 동안 무료이고 자동 결제가 없습니다. 이후에는 학생부의 재원생 수에 따라 50명까지 ${won(prices.standard)}(스탠다드), 51명 이상 ${won(prices.plus)}(플러스)이며 기능은 같습니다. 개선 제안·블로그 소개글 이벤트로 무료 기간을 늘릴 수 있습니다.` },
    { q: '홈페이지는 얼마나 걸려서 만들어지나요?', a: '학원 정보를 입력하고 3가지 테마 중 하나를 고르면 몇 분 안에 growweb.me/학원주소로 공개됩니다. 원장 소개·반·교습비는 관리 화면에서 이어서 채우면 됩니다.' },
    { q: '학부모에게 안내 문자는 어떻게 보내나요?', a: '상담 접수 확인, 레벨테스트 전날 안내, 상담 후 안내 문자가 관리 화면의 "보낼 문자"에 준비됩니다. 누르면 원장님 휴대폰 문자 앱이 문구가 채워진 채 열려 원장님 번호로 보내집니다. 별도 발송 비용이 없습니다.' },
    { q: '지금 홈페이지가 괜찮은지 확인할 수 있나요?', a: '무료 진단에 지금 쓰는 홈페이지나 블로그 주소를 넣으면 모바일 화면, 검색 노출, 상담 신청 구조, 학원 정보 표기를 바로 점검해 결과를 보여 드리고 이메일로도 보내 드립니다.' },
  ];
}

export function organization() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BRAND_NAME,
    alternateName: ['The Class', 'growweb'],
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
    description: BRAND_TAGLINE,
    email: OPERATOR.privacyEmail,
    legalName: OPERATOR.name,
    taxID: OPERATOR.bizNo,
    address: { '@type': 'PostalAddress', streetAddress: OPERATOR.address, addressCountry: 'KR' },
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email: OPERATOR.privacyEmail, availableLanguage: ['ko'] }],
    areaServed: { '@type': 'Country', name: '대한민국' },
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: BRAND_NAME,
    url: SITE_URL,
    inLanguage: 'ko-KR',
    description: BRAND_TAGLINE,
    publisher: { '@id': ORG_ID },
  };
}

export function softwareApp(prices?: { standard: number; plus: number }) {
  return {
    '@type': 'SoftwareApplication',
    '@id': SOFTWARE_ID,
    name: BRAND_NAME,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: '학원 홈페이지·상담 관리',
    operatingSystem: 'Web, iOS, Android (설치형 웹앱)',
    url: SITE_URL,
    description: SERVICE_DEFINITION,
    featureList: SERVICE_FEATURES,
    audience: { '@type': 'BusinessAudience', audienceType: AUDIENCE },
    inLanguage: 'ko-KR',
    publisher: { '@id': ORG_ID },
    ...(prices && {
      offers: [
        { '@type': 'Offer', name: '베타 (오픈일부터 3개월)', price: 0, priceCurrency: 'KRW', url: abs('/pricing') },
        { '@type': 'Offer', name: '스탠다드 (재원생 50명까지)', price: prices.standard, priceCurrency: 'KRW', url: abs('/pricing'), priceSpecification: { '@type': 'UnitPriceSpecification', price: prices.standard, priceCurrency: 'KRW', unitText: 'MONTH', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } } },
        { '@type': 'Offer', name: '플러스 (재원생 51명 이상)', price: prices.plus, priceCurrency: 'KRW', url: abs('/pricing'), priceSpecification: { '@type': 'UnitPriceSpecification', price: prices.plus, priceCurrency: 'KRW', unitText: 'MONTH', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } } },
      ],
    }),
  };
}




