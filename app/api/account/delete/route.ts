import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// POST — 회원 탈퇴. 혼자 원장인 학원이 있으면 막는다(학원 데이터의 처리자가 사라지므로 해지·이관 먼저)
export async function POST() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email }, include: { memberships: { where: { role: 'owner' }, select: { tenantId: true, tenant: { select: { name: true } } } } } });
  if (!user) return NextResponse.json({ ok: true });

  for (const m of user.memberships) {
    const owners = await prisma.membership.count({ where: { tenantId: m.tenantId, role: 'owner' } });
    if (owners <= 1) {
      return NextResponse.json({ error: `${m.tenant.name}의 유일한 원장이라 바로 탈퇴할 수 없습니다. 학원 데이터를 내보낸 뒤 더클 운영자에게 학원 해지 또는 원장 변경을 요청해 주세요.` }, { status: 409 });
    }
  }
  // 멤버십·동의 이력은 함께 삭제(Cascade). 결제 기록 등 법정 보관 정보는 학원에 남는다
  await prisma.user.delete({ where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
