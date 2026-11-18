/**
 * 블로그 글 구조화 데이터 — 글을 저장·공개하면 이 함수가 제목·요약·본문에서 자동으로 만든다.
 * 글 화면(/blog/[slug])과 운영자 글쓰기 화면의 미리보기가 같은 함수를 쓴다.
 *  - BlogPosting (+ 소속 블로그, 글자 수, 키워드, 목차)
 *  - BreadcrumbList
 *  - FAQPage — 본문의 "### Q. 질문" 소제목과 그 아래 답
 */
import { categoryLabel, excerpt } from './index';
import { parseMarkdown, plainText, tableOfContents, extractFaq } from './markdown';
import { ORG_ID, SITE_URL, WEBSITE_ID, abs, breadcrumb, faqPage } from '@/lib/seo/core';

export type PostForLd = {
  slug: string;
  title: string;
  seoTitle?: string | null;
  summary?: string | null;
  body: string;
  category: string;
  coverImage?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};

export const BLOG_ID = `${SITE_URL}/blog#blog`;

export function blogPostGraph(post: PostForLd): object[] {
  const url = abs(`/blog/${post.slug}`);
  const blocks = parseMarkdown(post.body);
  const text = plainText(post.body);
  const toc = tableOfContents(blocks);
  const faq = extractFaq(blocks);
  const posting = {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: (post.seoTitle || post.title).slice(0, 110),
    name: post.title,
    description: excerpt(post.summary ?? null, post.body, 150),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isPartOf: { '@id': BLOG_ID },
    inLanguage: 'ko-KR',
    articleSection: categoryLabel(post.category),
    keywords: [categoryLabel(post.category), '학원 운영', '학원·교습소', ...toc.slice(0, 6).map((t) => t.text)].join(', '),
    wordCount: text.replace(/\s+/g, '').length,
    ...(post.publishedAt && { datePublished: post.publishedAt.toISOString() }),
    ...((post.updatedAt ?? post.publishedAt) && { dateModified: (post.updatedAt ?? post.publishedAt)!.toISOString() }),
    ...(post.coverImage && { image: abs(post.coverImage) }),
    ...(toc.length > 0 && { hasPart: toc.map((t) => ({ '@type': 'WebPageElement', name: t.text, url: `${url}#${t.id}` })) }),
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  };
  const blog = { '@type': 'Blog', '@id': BLOG_ID, name: '더클 블로그', url: abs('/blog'), isPartOf: { '@id': WEBSITE_ID }, publisher: { '@id': ORG_ID }, inLanguage: 'ko-KR' };
  const org = { '@type': 'Organization', '@id': ORG_ID, name: '더클', url: SITE_URL, logo: abs('/api/app-icon?size=512') };
  return [
    posting,
    blog,
    org,
    breadcrumb([{ name: '블로그', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }]),
    ...(faq.length > 0 ? [faqPage(faq, `/blog/${post.slug}`)] : []),
  ];
}
