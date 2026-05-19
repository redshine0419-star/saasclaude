import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, name, lang = 'ko' } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '유효한 이메일을 입력해주세요.' }, { status: 400 });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { name: name?.trim() || undefined, lang },
      create: { email: email.toLowerCase().trim(), name: name?.trim() || undefined, lang },
    });
    return NextResponse.json({ ok: true, id: subscriber.id });
  } catch {
    return NextResponse.json({ error: '구독 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await prisma.newsletterSubscriber.count();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: 'DB 오류' }, { status: 500 });
  }
}
