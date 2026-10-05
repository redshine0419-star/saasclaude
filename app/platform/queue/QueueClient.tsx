'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Application = {
  id: string;
  queueOrder: number | null;
  academyName: string;
  directorName: string;
  subject: string;
  area: string;
  phone: string;
  status: string;
  expectedStartDate: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: 'applied', label: '신청 접수' },
  { value: 'waiting_docs', label: '자료 대기' },
  { value: 'in_progress', label: '제작 중' },
  { value: 'review', label: '시안 확인' },
  { value: 'ready', label: '오픈 준비' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  applied: { bg: '#FBF1CF', color: '#5A4A12' },
  waiting_docs: { bg: '#E6E9EE', color: '#2C3747' },
  in_progress: { bg: '#D8E8E0', color: '#1E5645' },
  review: { bg: '#E6EBF8', color: '#1D3FA8' },
  ready: { bg: '#1E5645', color: '#FFFFFF' },
};

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})-?\d{4}-?(\d{4})/, '$1-****-$2');
}

export function QueueClient({ apps }: { apps: Application[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Application | null>(null);
  const [status, setStatus] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openPanel(app: Application) {
    setSelected(app);
    setStatus(app.status);
    setExpectedStartDate(app.expectedStartDate ? app.expectedStartDate.slice(0, 10) : '');
    setTenantSlug('');
    setError('');
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/platform/queue/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          expectedStartDate: expectedStartDate || null,
          tenantSlug: tenantSlug || undefined,
        }),
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
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>#</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>학원명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>원장</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>과목·지역</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>연락처</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>예상 시작일</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}></th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => {
              const st = STATUS_STYLE[a.status] ?? { bg: '#F0F1F3', color: '#3C4659' };
              const stLabel = STATUS_OPTIONS.find((o) => o.value === a.status)?.label ?? a.status;
              return (
                <tr
                  key={a.id}
                  style={{
                    borderBottom: '1px solid #F0EDE7',
                    background: selected?.id === a.id ? '#F4FAF7' : undefined,
                  }}
                >
                  <td style={{ padding: '14px 20px', color: '#8A93A8', fontWeight: 600 }}>{a.queueOrder ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{a.academyName}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{a.directorName}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{a.subject} · {a.area}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{maskPhone(a.phone)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{stLabel}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#5A6270', fontSize: 13 }}>
                    {a.expectedStartDate ? new Date(a.expectedStartDate).toLocaleDateString('ko-KR') : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => openPanel(a)}
                      style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1E5645', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      편집
                    </button>
                  </td>
                </tr>
              );
            })}
            {apps.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#9AA3AF' }}>접수된 신청이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Side panel */}
      {selected && (
        <div
          style={{
            width: 320,
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
            <div>{selected.directorName} 원장 · {selected.subject} · {selected.area}</div>
            <div>신청 {new Date(selected.createdAt).toLocaleDateString('ko-KR')}</div>
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>예상 시작일</label>
            <input
              type="date"
              value={expectedStartDate}
              onChange={(e) => setExpectedStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {status === 'ready' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                학원 슬러그 <span style={{ fontWeight: 400, color: '#9AA3AF' }}>(오픈 처리 시 betaStartedAt 기록)</span>
              </label>
              <input
                type="text"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                placeholder="hanbit-math"
                style={inputStyle}
              />
            </div>
          )}

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
