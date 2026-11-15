import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { studentAccess } from '@/lib/students/access';

type Params = Promise<{ slug: string; id: string }>;

// PATCH — 보낼 문자 처리: sent(보냄) | skip(건너뛰기) | reopen(되돌리기). 원장·직원
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { slug, id } = await params;
  const a = await studentAccess(slug);
  if (a instanceof NextResponse) return a;
  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  if (!['sent', 'skip', 'reopen'].includes(action)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const task = await prisma.smsTask.findFirst({ where: { id, tenantId: a.tenantId }, select: { id: true, leadId: true, kind: true } });
  if (!task) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 });

  await prisma.smsTask.update({
    where: { id: task.id },
    data: action === 'reopen'
      ? { status: 'todo', doneAt: null, doneBy: null }
      : { status: action === 'sent' ? 'sent' : 'skipped', doneAt: new Date(), doneBy: a.email },
  });
  // 상담 진행 기록 — 문자 앱을 연 사실만 (번호·본문은 남기지 않는다)
  if (action === 'sent' && task.leadId) {
    await prisma.leadEvent.create({
      data: { leadId: task.leadId, type: 'message_sent', payload: { channel: 'sms_manual', template: task.kind }, actorId: a.email },
    }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
