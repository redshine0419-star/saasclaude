import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { AdminSide } from '@/components/admin/AdminSide';
import { studentPageAuth } from '@/lib/students/page-auth';

export const dynamic = 'force-dynamic';

const KIND_ICON: Record<string, string> = {
  new_lead: '📋', unanswered: '⏰', registration: '🎒', beta: '📅', billing: '💳', class_check: '🗓️', report: '📈', sms_due: '✉️',
};

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

type Props = { params: Promise<{ slug: string }> };

/** 알림함 — 원장·직원에게 가는 알림이 모두 여기 쌓인다 (앱 알림과 같은 내용). 열면 모두 읽음 처리 */
export default async function NotificationsPage({ params }: Props) {
  const { slug } = await params;
  const { tenant } = await studentPageAuth(slug);
  const items = await prisma.adminNotification.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  const unreadIds = items.filter((n) => !n.readAt).map((n) => n.id);
  if (unreadIds.length) await prisma.adminNotification.updateMany({ where: { tenantId: tenant.id, id: { in: unreadIds } }, data: { readAt: new Date() } });
  // 90일 지난 알림은 정리
  await prisma.adminNotification.deleteMany({ where: { tenantId: tenant.id, createdAt: { lt: new Date(Date.now() - 90 * 24 * 3600 * 1000) } } }).catch(() => undefined);

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '100vh', background: '#F4F2EE', color: '#1B2430', fontFamily: "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <AdminSide slug={slug} tenantName={tenant.name} active="notifications" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>알림함</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>
            새 상담, 답하지 않은 상담, 등록 대기, 무료 기간·결제 안내가 모두 여기에 쌓입니다. 휴대폰으로 받으려면 설정 › 앱 설치 · 앱 알림을 켜 주세요.
          </div>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
          {items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#5A6270', fontSize: 14 }}>아직 알림이 없습니다.</div>
          ) : (
            items.map((n, i) => {
              const fresh = unreadIds.includes(n.id);
              const inner = (
                <div style={{ display: 'flex', gap: 12, padding: '14px 18px', borderTop: i ? '1px solid #EEEAE2' : 'none', background: fresh ? '#FFFBEA' : '#FFFFFF', alignItems: 'flex-start' }}>
                  <span aria-hidden="true" style={{ fontSize: 20, lineHeight: '24px', flexShrink: 0 }}>{KIND_ICON[n.kind] ?? '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 15, fontWeight: fresh ? 700 : 600 }}>{n.title}</span>
                      <span style={{ fontSize: 12, color: '#8A93A0', flexShrink: 0 }}>{fmt(n.createdAt)}</span>
                    </div>
                    {n.body && <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.6, marginTop: 2, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>{n.body}</div>}
                  </div>
                </div>
              );
              return n.url ? <Link key={n.id} href={n.url} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>{inner}</Link> : <div key={n.id}>{inner}</div>;
            })
          )}
        </div>
      </main>
    </div>
  );
}
