import { describe, it, expect } from 'vitest';
import { ldJson, breadcrumb, homeFaq, softwareApp, faqPage, organization, SITE_URL } from '../jsonld';
import { blogPostGraph } from '@/lib/blog/jsonld';

describe('JSON-LD', () => {
  it('</script>와 줄 구분 문자를 막고 @graph로 감싼다', () => {
    const s = ldJson({ '@type': 'Thing', name: '</script><script>alert(1)</script> ' });
    expect(s).not.toContain('</script>');
    expect(s).not.toContain(' ');
    const back = JSON.parse(s);
    expect(back['@context']).toBe('https://schema.org');
    expect(back['@graph'][0].name).toContain('</script>');
  });
  it('경로 표시는 더클부터 차례로', () => {
    const b = breadcrumb([{ name: '요금', path: '/pricing' }]);
    expect(b.itemListElement.map((x) => x.position)).toEqual([1, 2]);
    expect(b.itemListElement[1].item).toBe(`${SITE_URL}/pricing`);
  });
  it('메인 FAQ·요금 구조화 데이터에 설정 금액이 들어간다', () => {
    const faq = homeFaq({ standard: 29000, plus: 49000 });
    expect(faq.find((f) => f.q.includes('요금'))!.a).toContain('월 29,000원');
    const app = softwareApp({ standard: 29000, plus: 49000 }) as { offers: { price: number }[] };
    expect(app.offers.map((o) => o.price)).toEqual([0, 29000, 49000]);
    expect(faqPage(faq, '/').mainEntity).toHaveLength(faq.length);
  });
  it('회사 정보에 운영자·연락처', () => {
    const o = organization();
    expect(o.name).toBe('더클');
    expect(o.email).toContain('@');
  });
});

describe('블로그 글 JSON-LD 자동 생성', () => {
  const post = {
    slug: 'test-post', title: '교습비 바꿀 때', summary: '요약', category: 'law', coverImage: '/x.jpg',
    body: '## 첫째\n\n본문\n\n## 자주 묻는 질문\n\n### Q. 신고는 언제?\n\n바꾸기 전에 합니다.\n\n### Q. 게시는?\n\n학원 안과 홈페이지에.',
    publishedAt: new Date('2026-11-01T00:00:00Z'), updatedAt: new Date('2026-11-02T00:00:00Z'),
  };
  const g = blogPostGraph(post) as Record<string, unknown>[];
  const types = g.map((n) => n['@type']);
  it('글·블로그·회사·경로·FAQ가 만들어진다', () => {
    expect(types).toEqual(['BlogPosting', 'Blog', 'Organization', 'BreadcrumbList', 'FAQPage']);
    const a = g[0] as { url: string; image: string; datePublished: string; wordCount: number; articleSection: string };
    expect(a.url).toBe(`${SITE_URL}/blog/test-post`);
    expect(a.image).toBe(`${SITE_URL}/x.jpg`);
    expect(a.datePublished).toBe('2026-11-01T00:00:00.000Z');
    expect(a.wordCount).toBeGreaterThan(0);
    expect((g[4] as { mainEntity: unknown[] }).mainEntity).toHaveLength(2);
  });
  it('FAQ가 없으면 FAQPage를 넣지 않는다', () => {
    const g2 = blogPostGraph({ ...post, body: '## 소제목\n\n본문만' });
    expect(g2.map((n) => (n as { '@type': string })['@type'])).not.toContain('FAQPage');
  });
});
