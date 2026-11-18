/**
 * 구조화 데이터 기본 조각 — 다른 무거운 모듈을 가져오지 않아 클라이언트 컴포넌트(글쓰기 미리보기 등)에서도 쓴다.
 */
import { BRAND_NAME } from '@/lib/brand';

export { ldJson } from './ld-json';

export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me').replace(/\/$/, '');
export const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

export const ORG_ID = `${SITE_URL}/#org`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SOFTWARE_ID = `${SITE_URL}/#software`;
export const LOGO_URL = `${SITE_URL}/api/app-icon?size=512`;

export type QA = { q: string; a: string };

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: BRAND_NAME, path: '/' }, ...items].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function faqPage(qa: QA[], path: string) {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(path)}#faq`,
    mainEntity: qa.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function webPage(o: { path: string; name: string; description?: string; type?: string; extra?: Record<string, unknown> }) {
  return {
    '@type': o.type ?? 'WebPage',
    '@id': `${abs(o.path)}#webpage`,
    url: abs(o.path),
    name: o.name,
    ...(o.description && { description: o.description }),
    inLanguage: 'ko-KR',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    ...o.extra,
  };
}
