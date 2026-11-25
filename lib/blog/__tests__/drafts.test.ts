import { describe, it, expect } from 'vitest';
import { BLOG_DRAFTS } from '../../../scripts/blog-drafts.mjs';
import { parseMarkdown, extractFaq } from '../markdown';
import { parseBlogInput, UNCHECKED_MARK, BLOG_SLUG_RE, isCategory } from '../index';

type Draft = { slug: string; category: string; title: string; summary: string; body: string };
const drafts = BLOG_DRAFTS as Draft[];

describe('블로그 초안', () => {
  it('빈 칸·중복 주소가 없다', () => {
    expect(drafts.every(Boolean)).toBe(true);
    const slugs = drafts.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(drafts.map((d) => [d.slug, d] as const))('%s — 형식', (_slug, d) => {
    expect(BLOG_SLUG_RE.test(d.slug)).toBe(true);
    expect(isCategory(d.category)).toBe(true);
    expect(d.title.length).toBeLessThanOrEqual(120);
    expect(d.summary.length).toBeLessThanOrEqual(300);
    const blocks = parseMarkdown(d.body);
    expect(blocks.some((b) => b.t === 'h2')).toBe(true);
  });

  it('2026-11-16 추가 글 — FAQ가 있고 카톡 표현이 없다', () => {
    const added = ['naver-place-guide', 'level-test-result-guide', 'tuition-refund-rules', 'parent-sms-examples', 'homepage-blog-instagram', 'monthly-parent-report',
      'academy-review-result-ads', 'class-capacity-waitlist', 'attendance-makeup-class', 'staff-account-management', 'vacation-special-class'];
    for (const slug of added) {
      const d = drafts.find((x) => x.slug === slug);
      expect(d, slug).toBeTruthy();
      expect(`${d!.title}${d!.summary}${d!.body}`).not.toMatch(/카톡|카카오|알림톡/);
      expect(extractFaq(parseMarkdown(d!.body)).length, slug).toBeGreaterThanOrEqual(3);
    }
  });

  it('【확인 필요】가 남은 초안은 공개할 수 없다', () => {
    for (const d of drafts) {
      const r = parseBlogInput({ ...d, status: 'published' }, () => true);
      expect(r.ok).toBe(!d.body.includes(UNCHECKED_MARK));
    }
  });
});
