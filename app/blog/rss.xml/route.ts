import { prisma } from '@/lib/prisma';
import { publishedWhere, categoryLabel, excerpt } from '@/lib/blog';
import { BLOG_BASE_URL } from '@/lib/blog/queries';

export const revalidate = 600;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 첫등원 블로그 RSS — 네이버 서치어드바이저 "RSS 제출"에 이 주소를 넣는다
export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: publishedWhere(), orderBy: { publishedAt: 'desc' }, take: 50,
    select: { slug: true, title: true, summary: true, body: true, category: true, publishedAt: true },
  }).catch(() => []);
  const items = posts.map((p) => {
    const url = `${BLOG_BASE_URL}/blog/${p.slug}`;
    return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><category>${esc(categoryLabel(p.category))}</category><description>${esc(excerpt(p.summary, p.body, 300))}</description>${p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : ''}</item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>첫등원 블로그</title><link>${BLOG_BASE_URL}/blog</link><atom:link href="${BLOG_BASE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/><description>학원 원장님을 위한 운영·법규·홍보 가이드</description><language>ko</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
}
