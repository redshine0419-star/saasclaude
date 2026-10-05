import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: '입력 오류' }, { status: 400 });

  const { academyName, area, subject, phone, currentUrl, agreed } = body;

  if (!academyName || !area || !subject || !phone) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
  }
  if (!agreed) {
    return NextResponse.json({ error: '개인정보 수집·이용에 동의해주세요.' }, { status: 400 });
  }

  const record = await prisma.diagnosticRequest.create({
    data: {
      academyName: academyName.trim(),
      area: area.trim(),
      subject: subject.trim(),
      phone: phone.trim(),
      currentUrl: currentUrl?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, id: record.id });
}
