import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { isStoredUrl } from '@/lib/storage';
import { newShareToken, parseResource } from '@/lib/resources';

type Params = Promise<{ slug: string }>;

// POST — 자료 올리기 (원장·직원)
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const parsed = parseResource(body, isStoredUrl);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const count = await prisma.resource.count({ where: { tenantId: a.tenantId } });
  if (count >= 500) return NextResponse.json({ error: '자료는 500개까지 올릴 수 있습니다. 오래된 자료를 지워 주세요.' }, { status: 409 });
  const r = await prisma.resource.create({
    data: { ...parsed.data, files: parsed.data.files, tenantId: a.tenantId, shareToken: newShareToken(), authorEmail: a.email },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: r.id });
}
