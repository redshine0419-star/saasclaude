'use client';

import { useState } from 'react';

interface Metric {
  label: string;
  value: string;
  unit: string;
}

interface ResultStat {
  id: string;
  termLabel: string;
  metrics: Metric[];
  basisText: string;
  published: boolean;
}

interface Props {
  slug: string;
  stats: ResultStat[];
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

const emptyMetric = (): Metric => ({ label: '', value: '', unit: '' });

export function ResultStatsClient({ slug, stats: initialStats }: Props) {
  const [stats, setStats] = useState<ResultStat[]>(initialStats);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [termLabel, setTermLabel] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>([emptyMetric()]);
  const [basisText, setBasisText] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openNew() {
    setEditId('new');
    setTermLabel('');
    setMetrics([emptyMetric()]);
    setBasisText('');
    setPublished(false);
    setError('');
  }

  function openEdit(stat: ResultStat) {
    setEditId(stat.id);
    setTermLabel(stat.termLabel);
    setMetrics(stat.metrics.length > 0 ? stat.metrics : [emptyMetric()]);
    setBasisText(stat.basisText);
    setPublished(stat.published);
    setError('');
  }

  function closePanel() {
    setEditId(null);
    setError('');
  }

  function updateMetric(i: number, field: keyof Metric, val: string) {
    setMetrics((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const body = {
        termLabel,
        metrics: metrics.filter((m) => m.label.trim()),
        basisText,
        published,
      };
      const url = editId === 'new'
        ? `/api/${slug}/admin/result-stats`
        : `/api/${slug}/admin/result-stats/${editId}`;
      const method = editId === 'new' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '저장 실패');
      if (editId === 'new') {
        setStats((prev) => [data.stat, ...prev]);
      } else {
        setStats((prev) => prev.map((s) => s.id === editId ? data.stat : s));
      }
      closePanel();
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류 발생');
    } finally {
      setSaving(false);
    }
  }

  async function deleteStat(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    const res = await fetch(`/api/${slug}/admin/result-stats/${id}`, { method: 'DELETE' });
    if (res.ok) setStats((prev) => prev.filter((s) => s.id !== id));
  }

  async function togglePublish(stat: ResultStat) {
    const res = await fetch(`/api/${slug}/admin/result-stats/${stat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !stat.published }),
    });
    const data = await res.json();
    if (res.ok) setStats((prev) => prev.map((s) => s.id === stat.id ? data.stat : s));
    else alert(data.error ?? '오류 발생');
  }

  return (
    <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>입시 실적 관리</h1>
          <button
            type="button"
            onClick={openNew}
            style={{ height: 40, padding: '0 16px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            + 새 실적 추가
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#5A6270', padding: '10px 14px', background: '#FBF1CF', borderRadius: 8 }}>
          근거 출처를 반드시 입력해야 공개할 수 있습니다. (SPEC §8 규칙)
        </div>
        {stats.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>
            등록된 입시 실적이 없습니다.
          </div>
        )}
        {stats.map((stat) => (
          <div
            key={stat.id}
            style={{
              padding: '18px 20px',
              background: '#FFFFFF',
              borderRadius: 12,
              border: editId === stat.id ? '2px solid #1E5645' : '1px solid #E2DDD2',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{stat.termLabel}</div>
              <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4 }}>
                {stat.metrics.map((m) => `${m.label} ${m.value}${m.unit}`).join(' · ')}
              </div>
              {stat.basisText && (
                <div style={{ fontSize: 12, color: '#9AA3AF', marginTop: 2 }}>근거: {stat.basisText}</div>
              )}
            </div>
            <span style={{
              padding: '2px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              background: stat.published ? '#D8E8E0' : '#E6E9EE',
              color: stat.published ? '#1E5645' : '#5A6270',
              cursor: 'pointer',
            }} onClick={() => togglePublish(stat)}>
              {stat.published ? '공개' : '비공개'}
            </span>
            <button type="button" onClick={() => openEdit(stat)} style={{ height: 34, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 6, background: '#FFFFFF', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>수정</button>
            <button type="button" onClick={() => deleteStat(stat.id)} style={{ height: 34, padding: '0 12px', border: '1px solid #FECACA', borderRadius: 6, background: '#FFFFFF', color: '#B91C1C', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>삭제</button>
          </div>
        ))}
      </div>

      {/* Edit panel */}
      {editId && (
        <div style={{ width: 380, padding: 24, background: '#FFFFFF', borderRadius: 12, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{editId === 'new' ? '새 실적 추가' : '실적 수정'}</div>
            <button onClick={closePanel} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9AA3AF' }}>×</button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>기간 레이블 *</label>
            <input type="text" value={termLabel} onChange={(e) => setTermLabel(e.target.value)} placeholder="예: 2024년 수능" style={inputStyle} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>지표</label>
              <button type="button" onClick={() => setMetrics((p) => [...p, emptyMetric()])} style={{ fontSize: 12, color: '#1E5645', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ 추가</button>
            </div>
            {metrics.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input type="text" value={m.label} onChange={(e) => updateMetric(i, 'label', e.target.value)} placeholder="항목명" style={{ ...inputStyle, flex: 2 }} />
                <input type="text" value={m.value} onChange={(e) => updateMetric(i, 'value', e.target.value)} placeholder="값" style={{ ...inputStyle, flex: 1 }} />
                <input type="text" value={m.unit} onChange={(e) => updateMetric(i, 'unit', e.target.value)} placeholder="단위" style={{ ...inputStyle, flex: 1 }} />
                {metrics.length > 1 && (
                  <button type="button" onClick={() => setMetrics((p) => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>근거 출처 (공개 시 필수) *</label>
            <input type="text" value={basisText} onChange={(e) => setBasisText(e.target.value)} placeholder="예: 학원 내부 집계 자료 (2024.11 기준)" style={inputStyle} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            홈페이지에 공개
          </label>

          {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FDE8E8', color: '#B91C1C', fontSize: 13 }}>{error}</div>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{ height: 44, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      )}
    </div>
  );
}
