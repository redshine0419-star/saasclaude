import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getIndex(lang: string): Promise<Array<{ slug: string; title: string; createdAt: string }>> {
  try {
    const { blobs } = await list({ prefix: `posts-index-${lang}.json` });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const [ko, en, ja] = await Promise.all([
      getIndex('ko'),
      getIndex('en'),
      getIndex('ja'),
    ]);

    const allPosts = [...ko, ...en, ...ja];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentWeekCount = allPosts.filter(
      (p) => new Date(p.createdAt) > sevenDaysAgo,
    ).length;

    const recent5 = [...allPosts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((p) => ({ title: p.title, slug: p.slug, createdAt: p.createdAt }));

    let emailSubscribers = 0;
    try {
      const result = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM email_subscribers WHERE service = 'marketerops'
      `;
      emailSubscribers = Number(result[0]?.count ?? 0);
    } catch { /* table may not exist yet */ }

    return NextResponse.json({
      service: 'marketerops',
      domain: 'growweb.me',
      blog: {
        total: allPosts.length,
        ko: ko.length,
        en: en.length,
        ja: ja.length,
        recentWeek: recentWeekCount,
        recent: recent5,
      },
      emailSubscribers,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
