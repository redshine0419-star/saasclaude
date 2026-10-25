'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minWidth: 0, height: 42, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF' };
const LABEL: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#5A6270' };

type Props = {
  slug: string;
  classes: { id: string; name: string; gradeBand: string | null }[];
  today: string;
  leadId: string | null;
  initial: { parentName: string; parentPhone: string; grade: string; school: string };
};

export function NewStudentForm({ slug, classes, today, leadId, initial }: Props) {
  const router = useRouter();
  const [f, setF] = useState({ name: '', grade: initial.grade, school: initial.school, classId: '', enrolledAt: today, parentName: initial.parentName, parentPhone: initial.parentPhone, studentPhone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/${slug}/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, leadId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) router.push(`/${slug}/admin/students/${data.id}`);
      else if (res.status === 409 && data.studentId) router.push(`/${slug}/admin/students/${data.studentId}`);
      else setError(data.error ?? '저장하지 못했습니다.');
    } catch {
      setError('저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, el: React.ReactNode) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={LABEL}>{label}</span>{el}</label>
  );

  return (
    <form onSubmit={submit} style={{ background: '#FFFFFF', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {field('학생 이름 *', <input value={f.name} onChange={set('name')} required maxLength={40} placeholder="홍길동" style={INPUT} />)}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        {field('학년', <input value={f.grade} onChange={set('grade')} maxLength={20} placeholder="중2" style={INPUT} />)}
        {field('학교', <input value={f.school} onChange={set('school')} maxLength={40} placeholder="○○중학교" style={INPUT} />)}
        {field('반', (
          <select value={f.classId} onChange={set('classId')} style={INPUT}>
            <option value="">반 미지정</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.gradeBand ? ` (${c.gradeBand})` : ''}</option>)}
          </select>
        ))}
        {field('등록일', <input type="date" value={f.enrolledAt} onChange={set('enrolledAt')} style={INPUT} />)}
        {field('학부모 이름', <input value={f.parentName} onChange={set('parentName')} maxLength={40} style={INPUT} />)}
        {field('학부모 연락처', <input type="tel" value={f.parentPhone} onChange={set('parentPhone')} maxLength={20} placeholder="010-0000-0000" style={INPUT} />)}
        {field('학생 연락처 (선택)', <input type="tel" value={f.studentPhone} onChange={set('studentPhone')} maxLength={20} placeholder="010-0000-0000" style={INPUT} />)}
      </div>
      {/* TODO(확인 필요): 만 14세 미만 학생 개인정보 수집 시 법정대리인 동의 방식(입학 원서 서면 동의로 갈음 가능한지) */}
      <div style={{ fontSize: 12, color: '#9AA3AF', lineHeight: 1.6 }}>학생 정보는 학원 관리자만 볼 수 있습니다. 입학 시 학부모 개인정보 수집·이용 동의를 받아 두세요.</div>
      {error && <div style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}
      <button type="submit" disabled={saving || !f.name.trim()} style={{ height: 46, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: !f.name.trim() ? 0.6 : 1 }}>
        {saving ? '저장 중…' : '학생부 만들기'}
      </button>
    </form>
  );
}
