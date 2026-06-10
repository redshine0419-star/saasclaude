import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'hello@growweb.me';

interface EmailSequenceItem {
  dayOffset: number;
  subject: string;
  html: string;
}

const SEQUENCE: EmailSequenceItem[] = [
  {
    dayOffset: 3,
    subject: '[MarketerOps.ai] 오늘 눈여겨보세요: 핵심 기능 3가지',
    html: `<h2>안녕하세요! 필수 기능을 안내해 드릴게요.</h2>
<ul>
  <li><strong>Engine Diagnosis</strong> — PageSpeed + SEO + GEO 점수 즉시 진단</li>
  <li><strong>Keyword Analysis</strong> — 검색 의도와 경쟁도 분석</li>
  <li><strong>Content Orchestrator</strong> — 블로그 7 SNS 일괄 생성</li>
</ul>
<p><a href="https://growweb.me/app" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">→ 지금 진단해보기</a></p>`,
  },
  {
    dayOffset: 7,
    subject: '[MarketerOps.ai] 이렇게 하면 텍스트 SEO 점수가 올라갑니다',
    html: `<h2>SEO 점수 올리는 실용 팁</h2>
<ol>
  <li>디스크립션 태그에 키워드 자연 스럽게 포함하기</li>
  <li>H1 태그 1개만, H2~H3으로 계층 구성하기</li>
  <li>이미지 alt 텍스트 필수 입력하기</li>
</ol>
<p>오늘 보너스: <a href="https://growweb.me/blog/ko">신규 마케팅 인사이트 보기 →</a></p>`,
  },
  {
    dayOffset: 14,
    subject: '[MarketerOps.ai] GEO 최적화, 해보셈나요?',
    html: `<h2>GEO(AI 검색 최적화)를 아시나요?</h2>
<p>ChatGPT, Perplexity 등 AI 검색 엔진에서 내 사이트가 노출되도록 하는 것이 GEO 최적화입니다.</p>
<p>MarketerOps.ai에서 한 번에 GEO 점수를 확인해보세요.</p>
<p><a href="https://growweb.me" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">→ GEO 진단 시작하기</a></p>`,
  },
];

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure table exists
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      service TEXT NOT NULL DEFAULT 'marketerops',
      source TEXT NOT NULL DEFAULT 'landing',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email, service)
    )
  `.catch(() => {});

  const now = new Date();
  let sent = 0;

  for (const step of SEQUENCE) {
    const windowStart = new Date(now.getTime() - (step.dayOffset + 0.5) * 86400000);
    const windowEnd = new Date(now.getTime() - (step.dayOffset - 0.5) * 86400000);

    const subscribers = await prisma.$queryRaw<{ email: string }[]>`
      SELECT email FROM email_subscribers
      WHERE service = 'marketerops'
        AND created_at BETWEEN ${windowStart} AND ${windowEnd}
    `;

    for (const sub of subscribers) {
      await sendEmail(sub.email, step.subject, step.html);
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
