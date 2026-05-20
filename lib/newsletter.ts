const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.NEWSLETTER_FROM ?? 'GrowWeb.me <newsletter@growweb.me>';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY 환경변수가 설정되지 않았습니다.');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: params.to, subject: params.subject, html: params.html }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Resend API 오류 (${res.status})`);
  }
}

interface PostSummary { title: string; slug: string; lang: string; metaDescription: string; keyword: string }

function buildNewsletterHtml(params: {
  tip: string;
  posts: PostSummary[];
  unsubscribeToken: string;
  lang: string;
}): string {
  const { tip, posts, unsubscribeToken, lang } = params;
  const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  const label = {
    ko: { greeting: '안녕하세요! 이번 주 마케팅 인사이트를 전해드립니다.', tipTitle: '이번 주 마케팅 팁', postsTitle: '최신 블로그 포스트', readMore: '읽어보기 →', cta: '무료 사이트 진단 바로 시작하기', ctaSub: 'GEO 점수·보안 헤더·콘텐츠 품질을 즉시 확인하세요', unsub: '구독 취소' },
    en: { greeting: "Hi! Here's your weekly marketing insight.", tipTitle: 'This Week\'s Marketing Tip', postsTitle: 'Latest Blog Posts', readMore: 'Read more →', cta: 'Get Your Free Site Diagnosis', ctaSub: 'Check your GEO score, security headers and content quality instantly', unsub: 'Unsubscribe' },
    ja: { greeting: '今週のマーケティングインサイトをお届けします。', tipTitle: '今週のマーケティングTip', postsTitle: '最新ブログ記事', readMore: '続きを読む →', cta: '無料サイト診断を始める', ctaSub: 'GEOスコア・セキュリティ・コンテンツ品質を今すぐ確認', unsub: '配信解除' },
  }[lang] ?? {
    greeting: '안녕하세요!', tipTitle: '이번 주 팁', postsTitle: '최신 포스트', readMore: '읽기 →', cta: '무료 진단', ctaSub: '', unsub: '구독 취소',
  };

  const postItems = posts.map(p =>
    `<tr><td style="padding:14px 0;border-bottom:1px solid #eee">
      <a href="${SITE_URL}/blog/${p.lang}/${p.slug}" style="font-size:15px;font-weight:700;color:#4f46e5;text-decoration:none">${p.title}</a>
      <p style="margin:4px 0 6px;font-size:13px;color:#64748b;line-height:1.5">${p.metaDescription || p.keyword}</p>
      <a href="${SITE_URL}/blog/${p.lang}/${p.slug}" style="font-size:12px;color:#4f46e5;font-weight:600">${label.readMore}</a>
    </td></tr>`
  ).join('');

  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <!-- Header -->
    <div style="background:#4f46e5;padding:24px 32px;text-align:center">
      <div style="color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px">⚡ GrowWeb.me</div>
      <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:4px">Weekly Marketing Intelligence</div>
    </div>

    <!-- Greeting -->
    <div style="padding:28px 32px 0">
      <p style="margin:0;font-size:14px;color:#64748b">${label.greeting}</p>
    </div>

    <!-- Tip -->
    <div style="margin:20px 32px;background:#faf5ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px 20px">
      <div style="font-size:11px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${label.tipTitle}</div>
      <div style="font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap">${tip.slice(0, 600)}</div>
    </div>

    <!-- Posts -->
    ${posts.length > 0 ? `
    <div style="padding:0 32px">
      <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${label.postsTitle}</div>
      <table style="width:100%;border-collapse:collapse">${postItems}</table>
    </div>` : ''}

    <!-- CTA -->
    <div style="margin:24px 32px;background:#f8fafc;border-radius:10px;padding:20px;text-align:center">
      <p style="margin:0 0 14px;font-size:13px;color:#64748b">${label.ctaSub}</p>
      <a href="${SITE_URL}/app" style="display:inline-block;background:#4f46e5;color:#fff;font-size:13px;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none">${label.cta}</a>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center">
      <p style="margin:0;font-size:11px;color:#94a3b8">
        © 2025 GrowWeb.me &nbsp;·&nbsp;
        <a href="${unsubUrl}" style="color:#94a3b8">${label.unsub}</a>
      </p>
    </div>
  </div>
</body></html>`;
}

export { buildNewsletterHtml, SITE_URL };
export type { PostSummary };
