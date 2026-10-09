import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAdminMembership } from '@/lib/admin-auth';

type Params = Promise<{ slug: string; id: string }>;

async function getAuthorizedTenant(slug: string) {
  const session = await auth();
  if (!session?.user?.email) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return null;
  const membership = await getAdminMembership(tenant.id, session.user.email!);
  return membership ? tenant : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const tenant = await getAuthorizedTenant(slug);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.post.findFirst({ where: { id, tenantId: tenant.id } });
  if (!post) return NextResponse.json({ error: '소식을 찾을 수 없습니다.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const { title, body: postBody, status, category, images } = body;

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(title?.trim() && { title: title.trim() }),
      ...(postBody?.trim() && { body: postBody.trim() }),
      ...(status && { status, publishedAt: status === 'published' && !post.publishedAt ? new Date() : undefined }),
      ...(category && { category }),
      ...(Array.isArray(images) && { images }),
    },
  });

  return NextResponse.json({ ok: true, id: updated.id });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const tenant = await getAuthorizedTenant(slug);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.post.findFirst({ where: { id, tenantId: tenant.id } });
  if (!post) return NextResponse.json({ error: '소식을 찾을 수 없습니다.' }, { status: 404 });

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
