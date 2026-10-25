'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CONSENT_METHOD_LABEL, CONSENT_TEMPLATE, type ConsentMethod } from '@/lib/students/labels';

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
  const [f, setF] = useState({ name: '', grade: initial.grade, school: initial.school, classId: '', enrolledAt: today, parentName: initial.parentName, parentPhone: initial.parentPhone, studentPhone: '', consentAt: today, consentMethod: 'written' as ConsentMethod });
  const [consented, setConsented] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [copied, setCopied] = useState(false);
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
        body: JSON.stringify({ ...f, consentConfirmed: consented, leadId }),
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
      {/* 학부모(법정대리인) 동의 — 서버에서도 날짜·방식이 없으면 등록을 막는다 (SPEC 14장) */}
      <div style={{ padding: 14, borderRadius: 10, background: '#F4F2EE', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>학부모 개인정보 수집·이용 동의</div>
        <div style={{ fontSize: 13, color: '#3E4652', lineHeight: 1.6 }}>
          성적·출결·학습 태도 같은 기록을 남기려면 학부모(만 14세 미만은 법정대리인) 동의를 먼저 받아 주세요. 동의서는 학원이 보관합니다.
          <button type="button" onClick={() => setShowTemplate((v) => !v)} style={{ marginLeft: 6, padding: 0, border: 'none', background: 'none', color: '#1E5645', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 0 }}>
            {showTemplate ? '동의서 예시 닫기' : '동의서 문구 예시 보기'}
          </button>
        </div>
        {showTemplate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <pre style={{ margin: 0, padding: 12, borderRadius: 8, background: '#FFFFFF', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{CONSENT_TEMPLATE}</pre>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(CONSENT_TEMPLATE); setCopied(true); } catch { setCopied(false); } }} style={{ height: 34, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>{copied ? '복사했습니다' : '문구 복사'}</button>
              <span style={{ fontSize: 12, color: '#9AA3AF' }}>예시 문구입니다. 학원 상황에 맞게 고쳐 쓰고, 필요하면 전문가 검토를 받으세요.</span>
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {field('동의 방식', (
            <select value={f.consentMethod} onChange={set('consentMethod')} style={INPUT}>
              {(Object.keys(CONSENT_METHOD_LABEL) as ConsentMethod[]).map((k) => <option key={k} value={k}>{CONSENT_METHOD_LABEL[k]}</option>)}
            </select>
          ))}
          {field('동의 받은 날', <input type="date" value={f.consentAt} max={today} onChange={set('consentAt')} style={INPUT} />)}
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
          학부모(법정대리인)에게 개인정보 수집·이용 동의를 받았습니다.
        </label>
      </div>
      <div style={{ fontSize: 12, color: '#9AA3AF', lineHeight: 1.6 }}>학생 정보는 학원 관리자만 볼 수 있고, 퇴원 처리하면 즉시 삭제됩니다.</div>
      {error && <div style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}
      <button type="submit" disabled={saving || !f.name.trim() || !consented} style={{ height: 46, border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: !f.name.trim() || !consented ? 0.6 : 1 }}>
        {saving ? '저장 중…' : '학생부 만들기'}
      </button>
    </form>
  );
}
