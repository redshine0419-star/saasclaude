'use client';

import { useState } from 'react';

/** 사진 한 장 선택 — 휴대폰 사진첩·카메라에서 바로 올린다 (교실·시설, 반 사진 등) */
export function PhotoPicker({ slug, value, onChange }: { slug: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ width: 96, height: 72, flexShrink: 0, border: '1px dashed #B7B0A2', borderRadius: 8, background: value ? `#E8E4DB url(${value}) center/cover no-repeat` : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#3E4652', cursor: uploading ? 'wait' : 'pointer' }}>
          {uploading ? '업로드 중…' : value ? '' : '+ 사진'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setUploading(true);
              setError('');
              try {
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch(`/api/${slug}/admin/upload`, { method: 'POST', body: fd });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.url) onChange(data.url);
                else setError(data.error ?? '사진을 올리지 못했습니다.');
              } catch {
                setError('사진을 올리지 못했습니다.');
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        <div style={{ fontSize: 12, color: '#9AA3AF', lineHeight: 1.5 }}>
          JPG·PNG·WebP, 5MB 이하
          {value && (
            <button type="button" onClick={() => onChange('')} style={{ display: 'block', marginTop: 4, padding: 0, border: 'none', background: 'none', color: '#8A3A1C', font: 'inherit', fontSize: 12, cursor: 'pointer' }}>사진 빼기</button>
          )}
        </div>
      </div>
      {error && <div style={{ fontSize: 12, color: '#B42318' }}>{error}</div>}
    </div>
  );
}
