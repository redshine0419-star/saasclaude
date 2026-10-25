import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail/send';
import { operatorRecipients, renderOperatorMail } from '@/lib/mail/operator';

// POST /api/platform/mail-test — 운영자 알림 메일 설정 점검용 테스트 발송
export async function POST() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const envAdmin = (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).includes(email);
  if (!envAdmin && !(await prisma.membership.findFirst({ where: { user: { email }, role: 'platform_admin' } }))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const to = operatorRecipients();
  const checks = {
    apiKey: !!process.env.RESEND_API_KEY,
    recipients: to.length,
    from: process.env.MAIL_FROM || '첫등원 <onboarding@resend.dev> (기본값)',
  };
  if (!checks.apiKey) return NextResponse.json({ ok: false, checks, reason: 'RESEND_API_KEY가 설정되지 않았습니다.' });
  if (to.length === 0) return NextResponse.json({ ok: false, checks, reason: 'OPERATOR_NOTIFY_EMAIL이 비어 있거나 형식이 올바르지 않습니다.' });

  const { html, text } = renderOperatorMail(
    {
      subject: '[첫등원] 알림 메일 테스트',
      heading: '알림 메일이 정상적으로 설정되었습니다',
      rows: [['보낸 사람', email], ['보낸 시각', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })]],
      linkPath: '/platform/settings',
      linkLabel: '플랫폼 설정 열기',
    },
    process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me',
  );
  const result = await sendMail({ to, subject: '[첫등원] 알림 메일 테스트', html, text });
  return NextResponse.json({ ok: result.sent, checks, reason: result.reason });
}
