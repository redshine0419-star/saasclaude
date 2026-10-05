import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

async function getAuthorizedTenant(slug: string) {
  const session = await auth();
  if (!session?.user?.email) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return null;
  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  return membership ? tenant : null;
}

const VALID_CATEGORIES = new Set(['notice', 'recruit', 'exam', 'gallery']);
const VALID_STATUSES = new Set(['draft', 'published', 'scheduled']);

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const tenant = await getAuthorizedTenant(slug);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const { title, body: postBody, category = 'notice', status = 'published', sendKakao = false, scheduledAt } = body;
  if (!title?.trim() || !postBody?.trim()) {
    return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 });
  }

  const cat = VALID_CATEGORIES.has(category) ? category : 'notice';
  const stat = VALID_STATUSES.has(status) ? status : 'published';

  const post = await prisma.post.create({
    data: {
      tenantId: tenant.id,
      title: title.trim(),
      body: postBody.trim(),
      category: cat as 'notice' | 'recruit' | 'exam',
      status: stat as 'draft' | 'published' | 'scheduled',
      publishedAt: stat === 'published' ? new Date() : scheduledAt ? new Date(scheduledAt) : null,
      sendKakao: Boolean(sendKakao),
      kakaoScheduledAt: sendKakao && scheduledAt ? new Date(scheduledAt) : sendKakao ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, id: post.id });
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const tenant = await getAuthorizedTenant(slug);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get('take') ?? '50'), 100);

  const posts = await prisma.post.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, title: true, category: true, status: true, publishedAt: true, sendKakao: true, createdAt: true },
  });

  return NextResponse.json(posts);
}
