import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';
import { generateText } from '@/lib/ai';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';
const GSC_SITE = process.env.GSC_SITE_URL ?? SITE_URL;

async function getAccessToken(): Promise<string | null> {
  // Try env-var refresh token first (service-level)
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  if (refreshToken) return refreshWithToken(refreshToken);

  // Fall back to admin user's stored token
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);
  if (!adminEmails.length) return null;
  const { getValidGSCToken } = await import('@/lib/gsc-tokens');
  return getValidGSCToken(adminEmails[0]);
}

async function refreshWithToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

async function getGSCKeywords(accessToken: string): Promise<{ keyword: string; position: number; url: string }[]> {
  const endDate = new Date();
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ['query', 'page'],
        rowLimit: 100,
        dimensionFilterGroups: [{
          filters: [{ dimension: 'page', operator: 'contains', expression: '/blog/' }],
        }],
      }),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.rows ?? []).filter(
    (r: { position: number }) => r.position >= 11 && r.position <= 20
  ).map((r: { keys: string[]; position: number }) => ({
    keyword: r.keys[0],
    url: r.keys[1],
    position: Math.round(r.position),
  }));
}

async function getPost(slug: string, lang: string): Promise<Record<string, unknown> | null> {
  try {
    const { blobs } = await list({ prefix: `posts/${lang}/${slug}.json` });
    if (!blobs.length) return null;
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function enhancePost(post: Record<string, unknown>, keyword: string): Promise<string> {
  const content = String(post.content ?? '');
  const lang = String(post.lang ?? 'ko');
  const prompt = lang === 'ko'
    ? `다음 블로그 포스트에 "${keyword}" 키워드를 타깃으로 하는 새 섹션(H2)을 추가해주세요.\n\n기존 포스트 내용:\n${content.slice(0, 3000)}\n\n요구사항:\n- 기존 내용 뒤에 새 H2 섹션 1개 추가 (300자 이상)\n- 키워드 "${keyword}" 를 자연스럽게 2-3회 포함\n- 마크다운 형식 유지\n- 전체 포스트(기존 + 추가 섹션)를 그대로 반환`
    : `Add a new H2 section targeting "${keyword}" to this blog post.\n\nExisting post:\n${content.slice(0, 3000)}\n\nRequirements:\n- Add 1 new H2 section at the end (min 200 words)\n- Naturally include keyword "${keyword}" 2-3 times\n- Keep markdown format\n- Return full post (existing + new section)`;

  const { text } = await generateText(prompt);
  return text || content;
}

async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !urls.length) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: new URL(SITE_URL).hostname, key, urlList: urls }),
    });
  } catch { /* ignore */ }
}

async function notifySlack(msg: string) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: msg }),
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ skipped: 'GSC token unavailable' });
  }

  const opportunities = await getGSCKeywords(accessToken);
  if (!opportunities.length) {
    return NextResponse.json({ skipped: 'No 11-20 rank keywords found' });
  }

  const enhanced: string[] = [];
  const errors: string[] = [];

  for (const opp of opportunities.slice(0, 5)) {
    try {
      // Extract slug and lang from URL like /blog/ko/my-slug
      const match = opp.url.match(/\/blog\/(ko|en|ja)\/([^/?#]+)/);
      if (!match) continue;
      const [, lang, slug] = match;

      const post = await getPost(slug, lang);
      if (!post) continue;

      const enhancedContent = await enhancePost(post, opp.keyword);
      await put(`posts/${lang}/${slug}.json`, JSON.stringify({ ...post, content: enhancedContent, updatedAt: new Date().toISOString() }), {
        access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
      });

      enhanced.push(opp.url);
    } catch (e) {
      errors.push(`${opp.keyword}: ${(e as Error).message}`);
    }
  }

  await pingIndexNow(enhanced);

  if (enhanced.length > 0) {
    await notifySlack(`🔍 [MarketerOps] GSC 11~20위 포스트 ${enhanced.length}개 자동 보강 완료\n${enhanced.join('\n')}`);
  }

  return NextResponse.json({ enhanced, errors });
}
