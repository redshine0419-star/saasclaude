import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { studentPageAuth } from '@/lib/students/page-auth';
import { maskPhone } from '@/lib/students/labels';
import { SMS_KIND_LABEL, isSmsKind } from '@/lib/sms/tasks';
import { fillSms, getSmsTemplates, DEFAULT_SMS_TEMPLATES } from '@/lib/sms/templates';
import { SmsClient, type SmsRow } from './SmsClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

/** 보낼 문자 — 시스템이 준비하고 원장이 휴대폰 문자 앱으로 직접 보낸다 (카톡 자동 발송 대신) */
export default async function SmsPage({ params }: Props) {
  const { slug } = await params;
  const { tenant, isOwner } = await studentPageAuth(slug);
  const now = new Date();

  // 이미 의미가 없어진 할 일은 자동으로 건너뛴다: 결정이 끝난 상담의 후속 안내, 지난 테스트의 전날 안내
  await prisma.smsTask.updateMany({
    where: { tenantId: tenant.id, status: 'todo', kind: 'followup', lead: { status: { in: ['enrolled', 'not_enrolled'] } } },
    data: { status: 'skipped', doneAt: now, doneBy: 'system' },
  });
  const staleReminders = await prisma.smsTask.findMany({ where: { tenantId: tenant.id, status: 'todo', kind: 'reminder' }, select: { id: true, refKey: true } });
  const past = staleReminders.filter((r) => r.refKey && new Date(r.refKey) < now).map((r) => r.id);
  if (past.length) await prisma.smsTask.updateMany({ where: { tenantId: tenant.id, id: { in: past } }, data: { status: 'skipped', doneAt: now, doneBy: 'system' } });

  const [todo, done, templates] = await Promise.all([
    prisma.smsTask.findMany({
      where: { tenantId: tenant.id, status: 'todo', dueAt: { lte: now } },
      orderBy: { dueAt: 'asc' },
      take: 200,
      include: { lead: { select: { id: true, parentName: true, phone: true, studentGrade: true, testAt: true } } },
    }),
    prisma.smsTask.findMany({
      where: { tenantId: tenant.id, status: { in: ['sent', 'skipped'] }, doneAt: { gte: new Date(now.getTime() - 30 * 24 * 3600 * 1000) } },
      orderBy: { doneAt: 'desc' },
      take: 50,
      include: { lead: { select: { id: true, parentName: true, phone: true, studentGrade: true, testAt: true } } },
    }),
    getSmsTemplates(tenant.id),
  ]);

  const toRow = (t: (typeof todo)[number]): SmsRow => {
    const kind = isSmsKind(t.kind) ? t.kind : 'receipt';
    return {
      id: t.id,
      kind,
      kindLabel: SMS_KIND_LABEL[kind],
      leadId: t.lead.id,
      parentName: t.lead.parentName,
      grade: t.lead.studentGrade,
      phone: t.lead.phone,
      phoneMasked: maskPhone(t.lead.phone),
      body: fillSms(templates[kind], { academy: tenant.name, parent: t.lead.parentName, grade: t.lead.studentGrade, testAt: t.lead.testAt }),
      status: t.status === 'sent' ? 'sent' : t.status === 'skipped' ? 'skipped' : 'todo',
      doneAt: t.doneAt?.toISOString() ?? null,
      bySystem: t.doneBy === 'system',
      createdAt: t.createdAt.toISOString(),
    };
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="sms" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>보낼 문자</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
            학부모에게 보낼 문자를 더클이 준비합니다. &ldquo;문자 보내기&rdquo;를 누르면 휴대폰 문자 앱이 번호·내용이 채워진 채로 열리고, 원장님 번호로 보내집니다(발송 비용 없음).
          </div>
        </div>
        <SmsClient
          slug={slug}
          todo={todo.map(toRow)}
          done={done.map(toRow)}
          templates={templates}
          defaults={DEFAULT_SMS_TEMPLATES}
          isOwner={isOwner}
        />
      </main>
    </div>
  );
}
