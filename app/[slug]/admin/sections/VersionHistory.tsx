'use client';

import { useState } from 'react';

export type VersionRow = {
  id: string;
  createdAt: string;
  actor: string;
  reason: string;
  theme: string;
  accentColor: string | null;
  enabledCount: number;
};

const REASON_LABEL: Record<string, string> = {
  initial: '기존 구성',
  onboarding: '홈페이지 개설',
  sections: '테마·섹션 변경',
  accent: '강조색 변경',
  restore: '되돌리기',
};

const THEME_LABEL: Record<string, string> = { warm: '원장 직강형', result: '성과 중심형', bright: '밝은 친근형' };

function formatKst(iso: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function VersionHistory({ slug, versions, canEdit }: { slug: string; versions: VersionRow[]; canEdit: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function restore(id: string) {
    if (!confirm('이 시점의 테마·섹션·강조색으로 되돌릴까요? 홈페이지에 바로 반영됩니다.')) return;
    setBusy(id);
    setError('');
    try {
      const res = await fetch(`/api/${slug}/admin/site-versions/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? '되돌리지 못했습니다.');
    } finally {
      setBusy(null);
    }
  }

  if (versions.length === 0) return null;

  return (
    <section style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>변경 이력</div>
      <div style={{ fontSize: 13, color: '#5A6270' }}>테마·섹션·강조색을 바꿀 때마다 기록됩니다. 최근 20개까지 보관합니다.</div>
      {error && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {versions.map((v, i) => (
          <li key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid #E2DDD2', borderRadius: 8, flexWrap: 'wrap' }}>
            <span
              aria-hidden="true"
              style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: v.accentColor ?? '#E2DDD2', border: '1px solid rgba(0,0,0,0.08)' }}
            />
            <span style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {REASON_LABEL[v.reason] ?? v.reason}
                {i === 0 && <span style={{ marginLeft: 8, fontSize: 12, color: '#1E5645' }}>현재</span>}
              </span>
              <span style={{ fontSize: 12, color: '#5A6270' }}>
                {formatKst(v.createdAt)} · {THEME_LABEL[v.theme] ?? v.theme} · 섹션 {v.enabledCount}개 · {v.actor}
              </span>
            </span>
            {canEdit && i > 0 && (
              <button
                type="button"
                onClick={() => restore(v.id)}
                disabled={busy !== null}
                style={{ height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
              >
                {busy === v.id ? '되돌리는 중…' : '이 상태로 되돌리기'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
