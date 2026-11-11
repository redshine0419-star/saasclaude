import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStoredUrl } from '@/lib/storage';
import { parseBlogInput } from '@/lib/blog';
import { blogAdmin } from '@/lib/blog/access';

// POST — 새 글 (운영자)
export async function POST(req: NextRequest) {
  const email = await blogAdmin();
  if (email instanceof NextResponse) return email;
  const parsed = parseBlogInput(await req.json().catch(() => null), isStoredUrl);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;
  if (await prisma.blogPost.findUnique({ where: { slug: d.slug }, select: { id: true } })) {
    return NextResponse.json({ error: '이미 같은 글 주소가 있습니다. 다른 주소를 써 주세요.' }, { status: 409 });
  }
  const post = await prisma.blogPost.create({
    data: { ...d, publishedAt: d.status === 'published' ? d.publishedAt ?? new Date() : d.publishedAt, authorEmail: email },
    select: { id: true, slug: true },
  });
  return NextResponse.json(post);
}
