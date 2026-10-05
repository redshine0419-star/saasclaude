'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DiagRequest = {
  id: string;
  academyName: string;
  area: string;
  subject: string;
  phone: string;
  currentUrl: string | null;
  status: string;
  resultNote: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: 'pending', label: '대기 중' },
  { value: 'in_review', label: '검토 중' },
  { value: 'done', label: '완료' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FBF1CF', color: '#5A4A12' },
  in_review: { bg: '#D8E8E0', color: '#1E5645' },
  done: { bg: '#E6E9EE', color: '#2C3747' },
};

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})-?\d{4}-?(\d{4})/, '$1-****-$2');
}

export function DiagnosisClient({ requests }: { requests: DiagRequest[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<DiagRequest | null>(null);
  const [status, setStatus] = useState('');
  const [resultNote, setResultNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openPanel(r: DiagRequest) {
    setSelected(r);
    setStatus(r.status);
    setResultNote(r.resultNote ?? '');
    setError('');
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/platform/diagnosis/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resultNote }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? '저장 실패');
      }
      setSelected(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류 발생');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #D8D3CA',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    background: '#FFFFFF',
    color: '#1B2430',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Table */}
      <div style={{ flex: 1, borderRadius: 12, background: '#FFFFFF', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2DDD2', background: '#F9F8F5' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>학원명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>지역</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>과목</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>연락처</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>현재 URL</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>신청일</th>
              <th style={{ padding: '12px 16px' }}></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const st = STATUS_STYLE[r.status] ?? { bg: '#F0F1F3', color: '#3C4659' };
              const stLabel = STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status;
              return (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid #F0EDE7',
                    background: selected?.id === r.id ? '#F4FAF7' : undefined,
                  }}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{r.academyName}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{r.area}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{r.subject}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{maskPhone(r.phone)}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.currentUrl ? (
                      <a href={r.currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D3FA8', fontSize: 12 }}>
                        {r.currentUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{stLabel}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#8A93A8', fontSize: 13 }}>
                    {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => openPanel(r)}
                      style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1E5645', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      처리
                    </button>
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#9AA3AF' }}>접수된 진단 신청이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Side panel */}
      {selected && (
        <div
          style={{
            width: 340,
            padding: 24,
            background: '#FFFFFF',
            borderRadius: 12,
            alignSelf: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.academyName}</div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9AA3AF', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.7 }}>
            <div>{selected.subject} · {selected.area}</div>
            <div>연락처: {selected.phone}</div>
            {selected.currentUrl && (
              <div>
                URL:{' '}
                <a href={selected.currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D3FA8' }}>
                  {selected.currentUrl}
                </a>
              </div>
            )}
            <div>신청: {new Date(selected.createdAt).toLocaleDateString('ko-KR')}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>진행 상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              진단 결과 메모 <span style={{ fontWeight: 400, color: '#9AA3AF' }}>(내부용)</span>
            </label>
            <textarea
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              rows={6}
              placeholder="SEO 현황, 경쟁 학원, 제안 방향 등..."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FDE8E8', color: '#B91C1C', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            style={{
              height: 44,
              borderRadius: 8,
              background: '#1E5645',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      )}
    </div>
  );
}
