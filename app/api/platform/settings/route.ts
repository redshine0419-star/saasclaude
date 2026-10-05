import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function isPlatformAdmin(email: string) {
  const m = await prisma.membership.findFirst({ where: { user: { email }, role: 'platform_admin' } });
  return !!m;
}

// GET /api/platform/settings — 전체 키값 조회
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(session.user.email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const settings = await prisma.platformSetting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json({ settings: map });
}

// PATCH /api/platform/settings — 키-값 일괄 업서트
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(session.user.email))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  // Only allow safe string values
  const entries = Object.entries(body as Record<string, unknown>).filter(
    ([, v]) => typeof v === 'string',
  ) as [string, string][];

  if (entries.length === 0) return NextResponse.json({ error: '변경 항목 없음' }, { status: 400 });

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );

  return NextResponse.json({ ok: true, updated: entries.length });
}
