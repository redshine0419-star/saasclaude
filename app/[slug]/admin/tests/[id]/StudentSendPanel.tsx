'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type SendStudent = { id: string; name: string; grade: string | null; classId: string | null; className: string | null; hasPhone: boolean; state: string | null; submitted: boolean };

const BTN: React.CSSProperties = { height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer', color: '#1B2430' };

/** 시험지 › 학생에게 보내기 — 반·학생을 골라 학생마다 다른 응시 링크를 만들고 '보낼 문자'에 올린다 */
export function StudentSendPanel({ slug, testId, testTitle, students, hasItems }: { slug: string; testId: string; testTitle: string; students: SendStudent[]; hasItems: boolean }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [cls, setCls] = useState<string>('all');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const classes = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of students) if (s.classId && s.className) m.set(s.classId, s.className);
    return [...m.entries()];
  }, [students]);
  const shown = students.filter((s) => cls === 'all' || (cls === 'none' ? !s.classId : s.classId === cls));
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const pickShown = () => setPicked((p) => { const n = new Set(p); for (const s of shown) if (!s.submitted) n.add(s.id); return n; });

  async function send() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/tests/${testId}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentIds: [...picked] }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: d.error ?? '보내지 못했습니다.' }); return; }
      setMsg({ ok: true, text: `${d.issued + d.reused}명에게 보낼 시험 링크 문자를 준비했습니다${d.reused ? ` (이미 받은 링크 다시 사용 ${d.reused}명)` : ''}.` });
      setPicked(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!hasItems) return <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 24, color: '#5A6270' }}>문항이 없는 시험지입니다. &ldquo;구성&rdquo;에서 문제를 먼저 넣어 주세요.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>&ldquo;{testTitle}&rdquo;을 재원생에게 보내기</div>
        <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.6 }}>
          학생을 고르고 &ldquo;시험 링크 문자 준비&rdquo;를 누르면 학생마다 다른 응시 링크가 만들어지고 &ldquo;✉️ 보낼 문자&rdquo;에 올라갑니다. 학생 번호로 보내며, 학생 번호가 없으면 학부모 번호로 보냅니다. 제출하면 자동 채점되고 학생부 성적(학원 테스트)에 자동으로 들어갑니다.
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ ...BTN, height: 36 }} aria-label="반 고르기">
            <option value="all">전체 재원생</option>
            {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            <option value="none">반 없음</option>
          </select>
          <button type="button" style={BTN} onClick={pickShown}>보이는 학생 모두 고르기</button>
          <button type="button" style={BTN} onClick={() => setPicked(new Set())}>선택 해제</button>
          <span style={{ fontSize: 13, color: '#5A6270' }}>{picked.size}명 선택</span>
          <button type="button" disabled={busy || picked.size === 0} onClick={send} style={{ ...BTN, marginLeft: 'auto', height: 38, border: 'none', background: '#1E5645', color: '#FFFFFF', fontWeight: 700, opacity: busy || picked.size === 0 ? 0.6 : 1 }}>
            {busy ? '준비 중…' : '시험 링크 문자 준비'}
          </button>
        </div>
        {msg && (
          <div role="status" style={{ padding: '10px 14px', borderRadius: 8, fontSize: 14, background: msg.ok ? '#E3F1EA' : '#FDECEC', color: msg.ok ? '#1E5645' : '#B91C1C' }}>
            {msg.text} {msg.ok && <Link href={`/${slug}/admin/sms`} style={{ color: '#1E5645', fontWeight: 700 }}>보낼 문자로 가기 →</Link>}
          </div>
        )}
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
        {shown.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#5A6270', fontSize: 14 }}>재원생이 없습니다. 학생부에서 학생을 먼저 등록해 주세요.</div>
        ) : (
          shown.map((s, i) => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderTop: i ? '1px solid #F2EFE9' : 'none', fontSize: 14, cursor: 'pointer', flexWrap: 'wrap' }}>
              <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} style={{ width: 18, height: 18 }} />
              <b style={{ minWidth: 70 }}>{s.name}</b>
              <span style={{ color: '#5A6270', fontSize: 13 }}>{[s.grade, s.className].filter(Boolean).join(' · ')}</span>
              {!s.hasPhone && <span style={{ fontSize: 12, color: '#8A5A00' }}>학생 번호 없음 → 학부모 번호로</span>}
              <span style={{ marginLeft: 'auto', fontSize: 13, color: s.submitted ? '#1E5645' : s.state ? '#8A5A00' : '#9AA3AF', fontWeight: s.state ? 600 : 400 }}>{s.state ?? '아직 안 보냄'}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
