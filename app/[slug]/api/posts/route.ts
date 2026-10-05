import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ slug: string }>;

const VALID_CATEGORIES = new Set(['notice', 'recruit', 'exam']);

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { slug, status: 'active' } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });

  const membership = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, user: { email: session.user.email } },
  });
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Parse multipart/form-data or JSON
  let title: string, body: string, category: string, sendKakao: boolean;
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData();
    title = String(fd.get('title') ?? '').trim();
    body = String(fd.get('body') ?? '').trim();
    category = String(fd.get('category') ?? 'notice');
    sendKakao = fd.get('sendKakao') === 'true';
    // image upload: TODO — Vercel Blob 연동 후 처리
  } else {
    const data = await req.json().catch(() => ({}));
    title = String(data.title ?? '').trim();
    body = String(data.body ?? '').trim();
    category = String(data.category ?? 'notice');
    sendKakao = Boolean(data.sendKakao);
  }

  if (!title || !body) return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 });
  if (!VALID_CATEGORIES.has(category)) category = 'notice';

  const now = new Date();
  const hour = now.getHours();
  // Night block: 21:00~08:00 → schedule for next day 08:00
  let kakaoScheduledAt: Date | null = null;
  if (sendKakao) {
    if (hour >= 21 || hour < 8) {
      const next = new Date(now);
      if (hour >= 21) next.setDate(next.getDate() + 1);
      next.setHours(8, 0, 0, 0);
      kakaoScheduledAt = next;
    } else {
      kakaoScheduledAt = now;
    }
  }

  const post = await prisma.post.create({
    data: {
      tenantId: tenant.id,
      title,
      body,
      category: category as 'notice' | 'recruit' | 'exam',
      status: 'published',
      publishedAt: now,
      sendKakao,
      kakaoScheduledAt,
    },
  });

  return NextResponse.json({ ok: true, id: post.id });
}
