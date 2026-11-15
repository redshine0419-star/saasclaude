import { NextRequest, NextResponse } from 'next/server';
import { studentAccess } from '@/lib/students/access';
import { isTemplatedSmsKind } from '@/lib/sms/tasks';
import { saveSmsTemplate } from '@/lib/sms/templates';

type Params = Promise<{ slug: string }>;

// PUT — 학부모 문자 기본 문구 고치기 (원장만). 비우면 기본 문구로
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const a = await studentAccess(slug, { ownerOnly: true });
  if (a instanceof NextResponse) return a;
  const body = await req.json().catch(() => ({}));
  if (!isTemplatedSmsKind(body?.kind) || typeof body?.body !== 'string') return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  await saveSmsTemplate(a.tenantId, body.kind, body.body);
  return NextResponse.json({ ok: true });
}
