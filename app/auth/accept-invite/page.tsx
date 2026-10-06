import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect('/');

  const invite = await prisma.memberInvite.findUnique({ where: { token } });
  if (!invite || invite.expiresAt < new Date()) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>초대 링크가 만료되었습니다</h1>
          <p style={{ color: '#5A6270', marginTop: 8 }}>원장에게 새 초대를 요청하세요.</p>
        </div>
      </div>
    );
  }

  const session = await auth();

  // 로그인하지 않은 경우 — Google 로그인 후 돌아오기
  if (!session?.user?.email) {
    redirect(`/auth/signin?callbackUrl=/auth/accept-invite?token=${token}`);
  }

  // 로그인한 이메일이 초대 이메일과 다른 경우
  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>이메일이 일치하지 않습니다</h1>
          <p style={{ color: '#5A6270', marginTop: 8 }}>
            초대받은 이메일({invite.email})로 로그인해야 합니다.
            <br />현재 로그인: {session.user.email}
          </p>
        </div>
      </div>
    );
  }

  // 이미 멤버인지 확인
  const tenant = await prisma.tenant.findUnique({ where: { id: invite.tenantId } });
  if (!tenant) redirect('/');

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect('/auth/signin');

  const existing = await prisma.membership.findFirst({
    where: { tenantId: tenant.id, userId: user.id },
  });

  if (!existing) {
    await prisma.membership.create({
      data: { tenantId: tenant.id, userId: user.id, role: invite.role },
    });
  }

  // 초대 사용 후 삭제
  await prisma.memberInvite.delete({ where: { id: invite.id } });

  redirect(`/${tenant.slug}/admin`);
}
