import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { purgeTenant } from '@/lib/retention';

type Params = Promise<{ id: string }>;

export const maxDuration = 300;

// POST /api/platform/academies/[id]/purge { confirmSlug } — 학원 영구 삭제 (운영자만, 비공개·운영 중지 학원만)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const envAdmin = (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).includes(email);
  const admin = envAdmin || !!(await prisma.membership.findFirst({ where: { user: { email }, role: 'platform_admin' }, select: { id: true } }));
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { slug: true, status: true, published: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  if (tenant.slug.startsWith('demo')) return NextResponse.json({ error: '데모 학원은 삭제할 수 없습니다.' }, { status: 400 });
  if (tenant.status === 'active' && tenant.published) {
    return NextResponse.json({ error: '공개 중인 학원은 삭제할 수 없습니다. 먼저 비공개로 바꿔 주세요.' }, { status: 409 });
  }
  const body = await req.json().catch(() => ({}));
  if (body?.confirmSlug !== tenant.slug) return NextResponse.json({ error: '확인을 위해 학원 주소(slug)를 정확히 입력해 주세요.' }, { status: 400 });

  const result = await purgeTenant(id);
  // 로그에는 학원 주소와 처리한 운영자만 남긴다
  console.log('[purge] 학원 영구 삭제', { slug: result.slug, by: email, payments: result.payments, files: result.files });
  return NextResponse.json({ ok: true, ...result });
}
