import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isStoredUrl } from '@/lib/storage';
import { parseBlogInput } from '@/lib/blog';
import { blogAdmin } from '@/lib/blog/access';

type Params = Promise<{ id: string }>;

// PATCH — 글 고치기·공개·숨김 (운영자)
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const email = await blogAdmin();
  if (email instanceof NextResponse) return email;
  const { id } = await params;
  const before = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true, publishedAt: true } });
  if (!before) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
  const parsed = parseBlogInput(await req.json().catch(() => null), isStoredUrl);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;
  if (d.slug !== before.slug && (await prisma.blogPost.findUnique({ where: { slug: d.slug }, select: { id: true } }))) {
    return NextResponse.json({ error: '이미 같은 글 주소가 있습니다. 다른 주소를 써 주세요.' }, { status: 409 });
  }
  // 처음 공개할 때 공개 날짜가 비어 있으면 지금으로
  const publishedAt = d.publishedAt ?? (d.status === 'published' ? before.publishedAt ?? new Date() : before.publishedAt);
  const post = await prisma.blogPost.update({ where: { id }, data: { ...d, publishedAt }, select: { id: true, slug: true } });
  revalidatePath('/blog');
  revalidatePath(`/blog/${before.slug}`);
  if (d.slug !== before.slug) revalidatePath(`/blog/${d.slug}`);
  return NextResponse.json(post);
}

// DELETE — 글 지우기 (운영자)
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const email = await blogAdmin();
  if (email instanceof NextResponse) return email;
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } });
  if (!post) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath('/blog');
  revalidatePath(`/blog/${post.slug}`);
  return NextResponse.json({ ok: true });
}
