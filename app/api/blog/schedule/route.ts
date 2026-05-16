import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';

export interface ScheduleConfig {
  enabled: boolean;
  intervalHours: number;
  lang: 'ko' | 'en' | 'ja';
  keywords: string[];
  targetAudience: string;
  tone: string;
  currentKeywordIndex: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

const DEFAULTS: ScheduleConfig = {
  enabled: false,
  intervalHours: 24,
  lang: 'ko',
  keywords: [],
  targetAudience: '',
  tone: '',
  currentKeywordIndex: 0,
  lastRunAt: null,
  nextRunAt: null,
};

export async function getScheduleConfig(): Promise<ScheduleConfig> {
  try {
    const { blobs } = await list({ prefix: 'blog-schedule-config.json' });
    if (blobs.length === 0) return DEFAULTS;
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return DEFAULTS;
    return { ...DEFAULTS, ...(await res.json()) };
  } catch {
    return DEFAULTS;
  }
}

export async function saveScheduleConfig(config: ScheduleConfig) {
  await put('blog-schedule-config.json', JSON.stringify(config), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function GET() {
  const config = await getScheduleConfig();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await getScheduleConfig();
    const updated: ScheduleConfig = { ...current, ...body };

    if (updated.enabled && !current.enabled && updated.keywords.length > 0) {
      updated.nextRunAt = new Date(Date.now() + updated.intervalHours * 3600 * 1000).toISOString();
    }
    if (!updated.enabled) {
      updated.nextRunAt = null;
    }

    await saveScheduleConfig(updated);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
