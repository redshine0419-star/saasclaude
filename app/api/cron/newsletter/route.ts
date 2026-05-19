import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { generateText } from '@/lib/ai';
import { sendEmail, buildNewsletterHtml } from '@/lib/newsletter';
import type { PostIndex } from '@/app/api/blog/generate/route';

const CRON_SECRET = process.env.CRON_SECRET;

async function getLatestPosts(lang: string, limit = 3): Promise<PostIndex[]> {
  try {
    const { blobs } = await list({ prefix: `posts-index-${lang}.json` });
    if (!blobs.length) return [];
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return [];
    const index: PostIndex[] = await res.json();
    return index.slice(0, limit);
  } catch {
    return [];
  }
}

async function generateWeeklyTip(lang: string): Promise<string> {
  const prompts: Record<string, string> = {
    ko: '마케터를 위한 실용적인 이번 주 마케팅 팁 1가지를 작성하세요. GEO(AI 검색 최적화), SEO, 콘텐츠 마케팅 중 하나를 골라 구체적이고 실행 가능한 조언을 3~4문장으로 작성하세요. 친근하고 전문적인 톤으로 작성하세요.',
    en: 'Write one practical marketing tip for this week. Choose from GEO (AI search optimization), SEO, or content marketing, and give specific, actionable advice in 3-4 sentences. Use a friendly and professional tone.',
    ja: 'マーケター向けに今週の実践的なマーケティングTipを1つ書いてください。GEO（AI検索最適化）、SEO、コンテンツマーケティングのいずれかを選び、具体的で実行可能なアドバイスを3〜4文で書いてください。',
  };

  try {
    const { text } = await generateText(prompts[lang] ?? prompts.ko);
    return text.trim();
  } catch {
    return lang === 'ko'
      ? '이번 주 팁: 블로그 포스트에 FAQ 섹션과 JSON-LD 마크업을 추가하면 AI 검색 결과에서 브랜드가 더 자주 인용됩니다. GEO 최적화의 핵심은 AI가 인용하기 쉬운 명확한 정의와 구조화된 콘텐츠입니다.'
      : 'This week\'s tip: Adding an FAQ section with JSON-LD markup to your blog posts helps your brand get cited more often in AI search results.';
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany();
  if (subscribers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: '구독자 없음' });
  }

  // 언어별 그룹화
  const byLang = subscribers.reduce<Record<string, typeof subscribers>>((acc, s) => {
    const l = ['ko', 'en', 'ja'].includes(s.lang) ? s.lang : 'ko';
    (acc[l] ??= []).push(s);
    return acc;
  }, {});

  let sent = 0;
  let failed = 0;

  for (const [lang, group] of Object.entries(byLang)) {
    const [posts, tip] = await Promise.all([
      getLatestPosts(lang, 3),
      generateWeeklyTip(lang),
    ]);

    const subjects: Record<string, string> = {
      ko: `📊 이번 주 마케팅 인사이트 — GrowWeb.me`,
      en: `📊 This Week's Marketing Insight — GrowWeb.me`,
      ja: `📊 今週のマーケティングインサイト — GrowWeb.me`,
    };

    for (const subscriber of group) {
      try {
        const html = buildNewsletterHtml({
          tip,
          posts: posts.map(p => ({ ...p, lang })),
          unsubscribeToken: subscriber.token,
          lang,
        });
        await sendEmail({
          to: subscriber.email,
          subject: subjects[lang] ?? subjects.ko,
          html,
        });
        sent++;
        // 발송 간격 (Resend 무료 플랜 rate limit 방지)
        await new Promise(r => setTimeout(r, 120));
      } catch {
        failed++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: subscribers.length });
}

// 관리자 수동 테스트 발송
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, lang = 'ko' } = await req.json();
  if (!email) return NextResponse.json({ error: 'email 필요' }, { status: 400 });

  const [posts, tip] = await Promise.all([getLatestPosts(lang, 3), generateWeeklyTip(lang)]);

  const html = buildNewsletterHtml({
    tip,
    posts: posts.map(p => ({ ...p, lang })),
    unsubscribeToken: 'test-token',
    lang,
  });

  await sendEmail({ to: email, subject: `[테스트] GrowWeb.me 뉴스레터`, html });
  return NextResponse.json({ ok: true, to: email });
}
