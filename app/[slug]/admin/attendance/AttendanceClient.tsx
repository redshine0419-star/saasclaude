'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AttendanceStatus } from '@prisma/client';
import { ATTENDANCE_LABEL, findHealthWords } from '@/lib/students/labels';

type Row = { id: string; name: string; grade: string | null; className: string | null; status: AttendanceStatus | null; note: string };
type Props = { slug: string; date: string; today: string; classId: string; classes: { id: string; name: string; days: string[] }[]; students: Row[] };

const STATUSES: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];
const ON: Record<AttendanceStatus, { background: string; color: string }> = {
  present: { background: '#1E5645', color: '#FFFFFF' },
  late: { background: '#B7791F', color: '#FFFFFF' },
  absent: { background: '#B42318', color: '#FFFFFF' },
  excused: { background: '#5A6270', color: '#FFFFFF' },
};
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

function shift(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

export function AttendanceClient({ slug, date, today, classId, classes, students }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(students);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const go = (d: string, c: string) => router.push(`/${slug}/admin/attendance?date=${d}${c ? `&classId=${c}` : ''}`);
  const weekday = WEEKDAY[new Date(`${date}T00:00:00Z`).getUTCDay()];

  function set(id: string, patch: Partial<Row>) {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty(true);
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, entries: rows.map((r) => ({ studentId: r.id, status: r.status, note: r.note })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDirty(false);
        setMsg({ ok: true, text: '저장했습니다.' });
        router.refresh();
      } else setMsg({ ok: false, text: data.error ?? '저장하지 못했습니다.' });
    } catch {
      setMsg({ ok: false, text: '저장하지 못했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  const count = (s: AttendanceStatus) => rows.filter((r) => r.status === s).length;
  const unchecked = rows.filter((r) => !r.status).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => go(shift(date, -1), classId)} aria-label="전날" style={{ width: 40, height: 40, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', font: 'inherit' }}>‹</button>
        <input type="date" value={date} max={today} onChange={(e) => e.target.value && go(e.target.value, classId)} style={{ height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>({weekday})</span>
        <button type="button" onClick={() => go(shift(date, 1), classId)} disabled={date >= today} aria-label="다음날" style={{ width: 40, height: 40, border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', cursor: date >= today ? 'default' : 'pointer', font: 'inherit', opacity: date >= today ? 0.4 : 1 }}>›</button>
        {date !== today && <button type="button" onClick={() => go(today, classId)} style={{ height: 40, padding: '0 12px', border: 'none', borderRadius: 8, background: '#F4F2EE', cursor: 'pointer', font: 'inherit', fontSize: 13 }}>오늘</button>}
        <select value={classId} onChange={(e) => go(date, e.target.value)} aria-label="반" style={{ flex: '1 1 160px', minWidth: 0, height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}>
          <option value="">전체 재원생</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.days.length ? ` (${c.days.join('·')})` : ''}{c.days.includes(weekday) ? ' · 오늘 수업' : ''}</option>)}
          <option value="none">반 미지정</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 40, background: '#FFFFFF', borderRadius: 12, textAlign: 'center', color: '#9AA3AF', lineHeight: 1.7 }}>
          이 반에 재원생이 없습니다. <Link href={`/${slug}/admin/students/new`} style={{ color: '#1E5645', fontWeight: 600 }}>학생 추가</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, color: '#3E4652' }}>
              {STATUSES.map((s) => `${ATTENDANCE_LABEL[s]} ${count(s)}`).join(' · ')}{unchecked ? ` · 미체크 ${unchecked}` : ''}
            </div>
            <button
              type="button"
              onClick={() => { setRows((p) => p.map((r) => (r.status ? r : { ...r, status: 'present' }))); setDirty(true); }}
              disabled={unchecked === 0}
              style={{ height: 36, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: unchecked ? 'pointer' : 'default', opacity: unchecked ? 1 : 0.5 }}
            >
              미체크 모두 출석
            </button>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
            {rows.map((r, i) => (
              <div key={r.id} style={{ padding: '12px 16px', borderTop: i ? '1px solid #EEEAE2' : 'none', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
                <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                  <Link href={`/${slug}/admin/students/${r.id}`} style={{ color: '#1B2430', fontWeight: 700, textDecoration: 'none' }}>{r.name}</Link>
                  <div style={{ fontSize: 12, color: '#5A6270' }}>{[r.grade, !classId && r.className].filter(Boolean).join(' · ')}</div>
                </div>
                <div role="radiogroup" aria-label={`${r.name} 출결`} style={{ display: 'flex', gap: 4 }}>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={r.status === s}
                      onClick={() => set(r.id, { status: r.status === s ? null : s })}
                      style={{ height: 36, padding: '0 10px', borderRadius: 8, border: r.status === s ? 'none' : '1px solid #D5D0C6', font: 'inherit', fontSize: 13, fontWeight: r.status === s ? 700 : 400, cursor: 'pointer', ...(r.status === s ? ON[s] : { background: '#FFFFFF', color: '#3E4652' }) }}
                    >
                      {ATTENDANCE_LABEL[s]}
                    </button>
                  ))}
                </div>
                {(r.status === 'late' || r.status === 'absent' || r.status === 'excused' || r.note) && (
                  <>
                    <input value={r.note} onChange={(e) => set(r.id, { note: e.target.value })} maxLength={100} placeholder="사유 (선택, 예: 병결·가족 행사 — 병명은 적지 마세요)" style={{ flex: '1 1 100%', minWidth: 0, boxSizing: 'border-box', height: 36, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 13 }} />
                    {findHealthWords(r.note).length > 0 && (
                      <div role="note" style={{ flex: '1 1 100%', fontSize: 12, color: '#7A4B00' }}>⚠️ 건강 정보는 민감정보입니다. &ldquo;병결&rdquo;처럼 적어 주세요.</div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ position: 'sticky', bottom: 0, padding: '12px 0', background: '#F4F2EE', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={save} disabled={saving || !dirty} style={{ height: 46, padding: '0 24px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: dirty ? 1 : 0.5 }}>
              {saving ? '저장 중…' : '출결 저장'}
            </button>
            {msg && <span style={{ fontSize: 14, color: msg.ok ? '#1E5645' : '#B42318' }}>{msg.text}</span>}
          </div>
        </>
      )}
    </div>
  );
}
