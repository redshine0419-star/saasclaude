import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';
import { newRegToken } from '@/lib/students/registration';

type Params = Promise<{ slug: string }>;

// POST — 학부모 등록 링크 만들기·재발급 (예전 링크는 즉시 막힌다). 원장만.
export async function POST(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  const token = newRegToken();
  await prisma.tenant.update({ where: { id: a.tenantId }, data: { studentRegToken: token } });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://growweb.me';
  return NextResponse.json({ ok: true, url: `${base}/${slug}/join/${token}` });
}

// DELETE — 등록 링크 끄기. 원장만.
export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  await prisma.tenant.update({ where: { id: a.tenantId }, data: { studentRegToken: null } });
  return NextResponse.json({ ok: true });
}
