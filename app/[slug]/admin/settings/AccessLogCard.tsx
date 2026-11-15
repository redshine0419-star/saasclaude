import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ACCESS_ACTION_LABEL, type AccessAction } from '@/lib/security/access-log';
import { ACCESS_LOG_DAYS } from '@/lib/retention';

const fmt = (d: Date) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

/** 설정 › 개인정보 접속 기록 (원장만) — 누가 언제 학생·상담 정보를 열람·수정·내보냈는지 */
export async function AccessLogCard({ tenantId, slug }: { tenantId: string; slug: string }) {
  const logs = await prisma.accessLog.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 100 });
  const studentIds = [...new Set(logs.filter((l) => l.targetType === 'student' && l.targetId).map((l) => l.targetId!))];
  const students = studentIds.length
    ? await prisma.student.findMany({ where: { tenantId, id: { in: studentIds } }, select: { id: true, name: true } })
    : [];
  const nameOf = new Map(students.map((s) => [s.id, s.name]));

  return (
    <section style={{ gridColumn: '1 / -1', padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>개인정보 접속 기록</div>
        <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4, lineHeight: 1.6 }}>
          원장님·직원이 학생·상담 정보를 열람·수정·삭제하거나 내려받은 기록입니다(최근 100건, {ACCESS_LOG_DAYS}일 보관). 기록에는 내용이나 연락처를 남기지 않습니다. 퇴사한 직원은 &ldquo;직원 관리&rdquo;에서 바로 삭제해 주세요.
        </div>
      </div>
      {logs.length === 0 ? (
        <div style={{ fontSize: 14, color: '#9AA3AF' }}>아직 기록이 없습니다.</div>
      ) : (
        <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid #EEEAE2', borderRadius: 8 }}>
          {logs.map((l, i) => {
            const label = ACCESS_ACTION_LABEL[l.action as AccessAction] ?? l.action;
            const studentName = l.targetType === 'student' && l.targetId ? nameOf.get(l.targetId) : undefined;
            return (
              <div key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '9px 12px', borderTop: i ? '1px solid #F2EFE9' : 'none', fontSize: 13 }}>
                <span style={{ color: '#8A93A0', width: 92, flexShrink: 0 }}>{fmt(l.createdAt)}</span>
                <span style={{ minWidth: 0, overflowWrap: 'anywhere', color: '#3E4652' }}>{l.actorEmail}</span>
                <span style={{ fontWeight: 600, color: l.action.startsWith('export') || l.action === 'delete_student' ? '#8A3A1C' : '#1B2430' }}>{label}</span>
                {studentName && <Link href={`/${slug}/admin/students/${l.targetId}`} style={{ color: '#1E5645' }}>{studentName}</Link>}
                {l.targetType === 'student' && l.targetId && !studentName && <span style={{ color: '#9AA3AF' }}>(삭제된 학생)</span>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
