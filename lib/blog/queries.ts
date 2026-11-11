import { prisma } from '@/lib/prisma';
import { publishedWhere, isCategory } from './index';

export const BLOG_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
export const BLOG_PAGE_SIZE = 12;

const listSelect = { id: true, slug: true, title: true, summary: true, body: true, category: true, coverImage: true, publishedAt: true, pinned: true } as const;

/** 공개 글 목록 (고정 글 먼저, 최신 순) */
export async function listPublishedPosts(opts: { category?: string; page?: number } = {}) {
  const where = { ...publishedWhere(), ...(isCategory(opts.category) && { category: opts.category }) };
  const page = Math.max(1, opts.page ?? 1);
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * BLOG_PAGE_SIZE,
      take: BLOG_PAGE_SIZE,
      select: listSelect,
    }),
    prisma.blogPost.count({ where }),
  ]).catch(() => [[], 0] as const);
  return { posts, total, page, pages: Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE)) };
}

export async function getPublishedPost(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, ...publishedWhere() } }).catch(() => null);
}

/** 같은 분류의 다른 글 (모자라면 최신 글로 채운다) */
export async function relatedPosts(post: { id: string; category: string }, n = 3) {
  const same = await prisma.blogPost.findMany({
    where: { ...publishedWhere(), category: post.category, id: { not: post.id } },
    orderBy: { publishedAt: 'desc' }, take: n, select: listSelect,
  }).catch(() => []);
  if (same.length >= n) return same;
  const more = await prisma.blogPost.findMany({
    where: { ...publishedWhere(), id: { notIn: [post.id, ...same.map((p) => p.id)] } },
    orderBy: { publishedAt: 'desc' }, take: n - same.length, select: listSelect,
  }).catch(() => []);
  return [...same, ...more];
}

export type BlogListItem = Awaited<ReturnType<typeof listPublishedPosts>>['posts'][number];
