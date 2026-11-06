import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';

type Params = Promise<{ slug: string }>;

// POST /api/[slug]/admin/visibility { published } — 홈페이지 공개·비공개 (원장만). 관리자 화면은 그대로 쓸 수 있다
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  const body = await req.json().catch(() => null);
  if (typeof body?.published !== 'boolean') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { id: a.tenantId }, select: { published: true, deletionRequestedAt: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  if (body.published && tenant.deletionRequestedAt) {
    return NextResponse.json({ error: '학원 삭제를 요청한 상태입니다. 다시 공개하려면 먼저 삭제 요청을 취소해 주세요.' }, { status: 409 });
  }
  if (tenant.published === body.published) return NextResponse.json({ ok: true, published: tenant.published });

  await prisma.tenant.update({
    where: { id: a.tenantId },
    data: body.published ? { published: true, unpublishedAt: null } : { published: false, unpublishedAt: new Date() },
  });
  return NextResponse.json({ ok: true, published: body.published });
}
