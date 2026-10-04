import { NextRequest, NextResponse } from 'next/server';
import { getAcademyPageData } from '@/lib/academy-data';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = await getAcademyPageData(slug);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.tel) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
  }

  // TODO: DB에 저장, 카카오톡 발송
  // 개인정보 보호: 로그에 tel 원문 남기지 않음

  return NextResponse.json({ ok: true });
}
