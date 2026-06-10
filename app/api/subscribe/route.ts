import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const LEAD_MAGNET_URL = 'https://growweb.me/blog/ko';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'hello@growweb.me';

async function sendWelcomeEmail(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: '[MarketerOps.ai] 에선 가입해주셔서 감사합니다 🚀',
      html: `
        <h2>안녕하세요! MarketerOps.ai에 오신 것을 환영합니다.</h2>
        <p>저희 서비스는 페이지속도, SEO, GEO 점수를 무료로 즐시 진단해드립니다.</p>
        <p><a href="https://growweb.me" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">→ MarketerOps.ai 무료 진단 시작하기</a></p>
        <hr/>
        <p style="color:#6b7280;font-size:12px;">마케팅 인사이트 블로그: <a href="${LEAD_MAGNET_URL}">${LEAD_MAGNET_URL}</a></p>
      `,
    }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json() as { email?: string; source?: string };
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return NextResponse.json({ error: '유효하지 않은 이메일' }, { status: 400 });
    }

    // Upsert subscriber
    await prisma.$executeRaw`
      INSERT INTO email_subscribers (email, service, source, created_at)
      VALUES (${email}, 'marketerops', ${source ?? 'landing'}, NOW())
      ON CONFLICT (email, service) DO NOTHING
    `;

    await sendWelcomeEmail(email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
