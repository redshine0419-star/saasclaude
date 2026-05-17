import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';

export interface ScheduleConfig {
  lang: 'ko' | 'en' | 'ja';
  enabled: boolean;
  intervalHours: number;
  keywords: string[];
  targetAudience: string;
  tone: string;
  currentKeywordIndex: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

function defaults(lang: 'ko' | 'en' | 'ja'): ScheduleConfig {
  return {
    lang,
    enabled: false,
    intervalHours: 24,
    keywords: [],
    targetAudience: '',
    tone: '',
    currentKeywordIndex: 0,
    lastRunAt: null,
    nextRunAt: null,
  };
}

export async function getScheduleConfig(lang: 'ko' | 'en' | 'ja' = 'ko'): Promise<ScheduleConfig> {
  try {
    const { blobs } = await list({ prefix: `blog-schedule-config-${lang}.json` });
    if (blobs.length === 0) {
      // Migrate old single config for ko only
      if (lang === 'ko') {
        const { blobs: old } = await list({ prefix: 'blog-schedule-config.json' });
        if (old.length > 0) {
          const res = await fetch(old[0].url, { cache: 'no-store' });
          if (res.ok) return { ...defaults(lang), ...(await res.json()), lang };
        }
      }
      return defaults(lang);
    }
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return defaults(lang);
    return { ...defaults(lang), ...(await res.json()), lang };
  } catch {
    return defaults(lang);
  }
}

export async function saveScheduleConfig(lang: 'ko' | 'en' | 'ja', config: ScheduleConfig) {
  await put(`blog-schedule-config-${lang}.json`, JSON.stringify(config), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function GET(req: NextRequest) {
  const lang = (req.nextUrl.searchParams.get('lang') ?? 'ko') as 'ko' | 'en' | 'ja';
  const config = await getScheduleConfig(lang);
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  const lang = (req.nextUrl.searchParams.get('lang') ?? 'ko') as 'ko' | 'en' | 'ja';
  try {
    const body = await req.json();
    const current = await getScheduleConfig(lang);
    const updated: ScheduleConfig = { ...current, ...body, lang };

    if (updated.enabled && !current.enabled && updated.keywords.length > 0) {
      updated.nextRunAt = new Date(Date.now() + updated.intervalHours * 3600 * 1000).toISOString();
    }
    if (!updated.enabled) {
      updated.nextRunAt = null;
    }

    await saveScheduleConfig(lang, updated);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
