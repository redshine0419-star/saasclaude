import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { isStoredUrl } from '@/lib/storage';
import { asFiles, parseResource } from '@/lib/resources';

type Params = Promise<{ slug: string; id: string }>;

async function removeFiles(urls: string[]) {
  const blobs = urls.filter((u) => u.startsWith('https://'));
  if (blobs.length && process.env.BLOB_READ_WRITE_TOKEN) await del(blobs).catch(() => {});
}

// PATCH — 자료 고치기 (원장·직원). 빠진 첨부 파일은 저장소에서도 지운다
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const existing = await prisma.resource.findFirst({ where: { id, tenantId: a.tenantId } });
  if (!existing) return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  const parsed = parseResource(body, isStoredUrl);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await prisma.resource.update({ where: { id }, data: { ...parsed.data, files: parsed.data.files } });
  const kept = new Set(parsed.data.files.map((f) => f.url));
  await removeFiles(asFiles(existing.files).map((f) => f.url).filter((u) => !kept.has(u)));
  return NextResponse.json({ ok: true });
}

// DELETE — 자료 지우기 (원장·직원). 첨부 파일도 지운다
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const existing = await prisma.resource.findFirst({ where: { id, tenantId: a.tenantId } });
  if (!existing) return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 });
  await prisma.resource.delete({ where: { id } });
  await removeFiles(asFiles(existing.files).map((f) => f.url));
  return NextResponse.json({ ok: true });
}
