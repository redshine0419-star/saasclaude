import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { slugError } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const slug = (req.nextUrl.searchParams.get('s') ?? '').trim().toLowerCase();
  const err = slugError(slug);
  if (err) return NextResponse.json({ available: false, error: err });

  const taken = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  return NextResponse.json(taken ? { available: false, error: '이미 사용 중인 주소입니다.' } : { available: true });
}
