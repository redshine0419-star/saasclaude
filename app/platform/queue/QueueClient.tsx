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
  currentUrl: string | null;
  wantsPhotoShoot: boolean;
  uploadedFiles: string[];
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
      {/* Kanban board */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflowX: 'auto', alignItems: 'flex-start', minWidth: 0 }}>
        {STATUS_OPTIONS.map((stage) => {
          const stStyle = STATUS_STYLE[stage.value] ?? { bg: '#F0F1F3', color: '#3C4659' };
          const stageApps = apps.filter((a) => a.status === stage.value);
          return (
            <div
              key={stage.value}
              style={{
                minWidth: 220,
                flex: 1,
                background: '#F4F2EE',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px 8px', borderBottom: `2px solid ${stStyle.color}22` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: stStyle.color }}>{stage.label}</span>
                <span style={{ fontSize: 12, background: stStyle.bg, color: stStyle.color, borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>{stageApps.length}</span>
              </div>

              {/* Cards */}
              {stageApps.length === 0 ? (
                <div style={{ fontSize: 12, color: '#B0A9A0', textAlign: 'center', padding: '16px 0' }}>없음</div>
              ) : (
                stageApps.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openPanel(a)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      background: selected?.id === a.id ? '#E4EEE9' : '#FFFFFF',
                      border: selected?.id === a.id ? '1px solid #1E5645' : '1px solid transparent',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      font: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{a.academyName}</div>
                    <div style={{ fontSize: 12, color: '#5A6270' }}>{a.subject} · {a.area}</div>
                    {a.queueOrder !== null && (
                      <div style={{ fontSize: 11, color: '#9AA3AF' }}>순번 {a.queueOrder}</div>
                    )}
                    {a.expectedStartDate && (
                      <div style={{ fontSize: 11, color: '#1E5645', fontWeight: 600 }}>
                        시작 예정: {new Date(a.expectedStartDate).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                    {a.uploadedFiles.length === 0 && a.status === 'waiting_docs' && (
                      <div style={{ fontSize: 11, color: '#C8433A', fontWeight: 600 }}>자료 미제출</div>
                    )}
                  </button>
                ))
              )}
            </div>
          );
        })}
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
            {selected.currentUrl && (
              <div><a href={selected.currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D3FA8' }}>현재 홈페이지 ↗</a></div>
            )}
            {selected.wantsPhotoShoot && (
              <div style={{ marginTop: 4, padding: '4px 8px', borderRadius: 6, background: '#FBF1CF', color: '#5A4A12', display: 'inline-block', fontWeight: 600 }}>📷 사진 촬영 요청</div>
            )}
          </div>

          {/* Uploaded files */}
          {selected.uploadedFiles.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>제출 자료 ({selected.uploadedFiles.length}개)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selected.uploadedFiles.map((url, i) => {
                  const name = url.startsWith('http') ? url.split('/').pop() ?? url : url;
                  return (
                    <a
                      key={i}
                      href={url.startsWith('http') ? url : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, color: '#1D3FA8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                    >
                      {name}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

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
