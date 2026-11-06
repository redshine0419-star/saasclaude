import { after, NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { notifyOperator } from '@/lib/mail/operator';

type Params = Promise<{ slug: string }>;

// POST — 학원 삭제 요청 (원장만). 요청하면 홈페이지는 바로 비공개, 실제 삭제는 운영자가 확인 후 진행한다
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  const body = await req.json().catch(() => ({}));
  const tenant = await prisma.tenant.findUnique({ where: { id: a.tenantId }, select: { name: true, published: true, deletionRequestedAt: true } });
  if (!tenant) return NextResponse.json({ error: '학원을 찾을 수 없습니다.' }, { status: 404 });
  if (typeof body?.confirmName !== 'string' || body.confirmName.trim() !== tenant.name) {
    return NextResponse.json({ error: '확인을 위해 학원 이름을 정확히 입력해 주세요.' }, { status: 400 });
  }
  if (tenant.deletionRequestedAt) return NextResponse.json({ ok: true, requestedAt: tenant.deletionRequestedAt });

  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 300) || null : null;
  const now = new Date();
  await prisma.tenant.update({
    where: { id: a.tenantId },
    data: {
      deletionRequestedAt: now,
      deletionRequestedBy: a.email,
      deletionReason: reason,
      ...(tenant.published && { published: false, unpublishedAt: now }),
    },
  });
  after(() =>
    notifyOperator({
      subject: `[첫등원] 학원 삭제 요청 — ${tenant.name}`,
      heading: '원장님이 학원 삭제를 요청했습니다',
      rows: [['학원', `${tenant.name} (${slug})`], ['요청한 사람', a.email], ['사유', reason ?? '적지 않음']],
      linkPath: '/platform/hidden',
      linkLabel: '비공개·삭제 요청 보기',
    }).catch(() => {}),
  );
  return NextResponse.json({ ok: true, requestedAt: now });
}

// DELETE — 삭제 요청 취소 (원장만). 홈페이지는 비공개로 남고, 원장이 직접 다시 공개한다
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  await prisma.tenant.update({ where: { id: a.tenantId }, data: { deletionRequestedAt: null, deletionRequestedBy: null, deletionReason: null } });
  return NextResponse.json({ ok: true });
}
