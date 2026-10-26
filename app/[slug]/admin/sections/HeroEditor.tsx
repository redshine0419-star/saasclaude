'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HERO_LIMITS, heroDefaults, type HeroTheme } from '@/lib/hero';

type Props = {
  slug: string;
  theme: HeroTheme;
  subjects: string | null;
  canEdit: boolean;
  initial: { heroBadge: string | null; heroTitle: string | null; heroSubtitle: string | null; heroPhotos: string[] };
};

const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minWidth: 0, padding: '10px 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF', lineHeight: 1.6 };
const LABEL: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#5A6270' };
const PHOTO_HINT: Record<HeroTheme, string> = {
  warm: '첫 번째 사진이 PC 화면 메인 사진으로 보입니다. (휴대폰에서는 원장 사진이 먼저 보입니다)',
  result: '성과 표를 공개하지 않을 때 첫 번째 사진이 메인에 보입니다.',
  bright: '세 장 모두 메인 사진 칸에 순서대로 보입니다. 1번이 가장 큰 칸입니다.',
};
const SLOT_LABEL = ['1 (큰 칸)', '2', '3'];

export function HeroEditor({ slug, theme, subjects, canEdit, initial }: Props) {
  const router = useRouter();
  const def = heroDefaults(theme, subjects);
  const [f, setF] = useState({ heroBadge: initial.heroBadge ?? '', heroTitle: initial.heroTitle ?? '', heroSubtitle: initial.heroSubtitle ?? '' });
  const [photos, setPhotos] = useState<string[]>(initial.heroPhotos);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty =
    f.heroBadge !== (initial.heroBadge ?? '') || f.heroTitle !== (initial.heroTitle ?? '') || f.heroSubtitle !== (initial.heroSubtitle ?? '') || photos.join('|') !== initial.heroPhotos.join('|');

  async function upload(i: number, file: File) {
    setUploading(i);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/${slug}/admin/upload`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) return setMsg({ ok: false, text: data.error ?? '사진을 올리지 못했습니다.' });
      setPhotos((p) => {
        const next = [...p];
        if (i < next.length) next[i] = data.url;
        else next.push(data.url);
        return next;
      });
    } catch {
      setMsg({ ok: false, text: '사진을 올리지 못했습니다.' });
    } finally {
      setUploading(null);
    }
  }

  function move(i: number, d: -1 | 1) {
    setPhotos((p) => {
      const next = [...p];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/hero`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, heroPhotos: photos }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: data.error ?? '저장하지 못했습니다.' });
      setMsg({ ok: true, text: '저장했습니다. 홈페이지에 바로 반영됩니다.' });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: '저장하지 못했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>메인 화면 (첫 화면)</h2>
        <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>홈페이지에서 보기 ↗</a>
      </div>
      <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.6 }}>
        학부모가 홈페이지에 들어오면 가장 먼저 보는 문구와 사진입니다. 비워 두면 회색 글씨의 기본 문구가 보입니다.
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={LABEL}>강조 문구 (선택)<span style={{ fontWeight: 400 }}>{f.heroBadge.length}/{HERO_LIMITS.badge}</span></span>
        <input value={f.heroBadge} disabled={!canEdit} maxLength={HERO_LIMITS.badge} onChange={(e) => setF((p) => ({ ...p, heroBadge: e.target.value }))} placeholder="예: 겨울방학 특강 모집 중 (비우면 표시 안 함)" style={INPUT} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={LABEL}>제목 (2줄까지, 줄바꿈 가능)<span style={{ fontWeight: 400 }}>{f.heroTitle.length}/{HERO_LIMITS.title}</span></span>
        <textarea value={f.heroTitle} disabled={!canEdit} maxLength={HERO_LIMITS.title} rows={2} onChange={(e) => setF((p) => ({ ...p, heroTitle: e.target.value.split('\n').slice(0, 2).join('\n') }))} placeholder={def.title} style={{ ...INPUT, resize: 'none' }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={LABEL}>소개 문구<span style={{ fontWeight: 400 }}>{f.heroSubtitle.length}/{HERO_LIMITS.subtitle}</span></span>
        <textarea value={f.heroSubtitle} disabled={!canEdit} maxLength={HERO_LIMITS.subtitle} rows={3} onChange={(e) => setF((p) => ({ ...p, heroSubtitle: e.target.value }))} placeholder={def.subtitle} style={{ ...INPUT, resize: 'vertical' }} />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={LABEL}>대표 사진 (최대 {HERO_LIMITS.photos}장)</span>
        <div style={{ fontSize: 12, color: '#9AA3AF', lineHeight: 1.6 }}>{PHOTO_HINT[theme]} 얼굴이 나온 사진은 보호자 동의를 받은 경우에만 올려 주세요.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {[0, 1, 2].map((i) => {
            const src = photos[i];
            const canAdd = i <= photos.length;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ aspectRatio: '4 / 3', borderRadius: 10, border: src ? 'none' : '1px dashed #B7B0A2', background: src ? `#E8E4DB url(${src}) center/cover no-repeat` : '#FAF9F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#5A6270', cursor: canEdit && canAdd ? (uploading === i ? 'wait' : 'pointer') : 'default', opacity: canAdd ? 1 : 0.4, textAlign: 'center', padding: 4 }}>
                  {uploading === i ? '올리는 중…' : src ? '' : canAdd ? `+ 사진 ${SLOT_LABEL[i]}` : `사진 ${SLOT_LABEL[i]}`}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={!canEdit || !canAdd || uploading !== null}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) upload(i, file);
                    }}
                  />
                </label>
                {src && canEdit && (
                  <div style={{ display: 'flex', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
                    {i > 0 && <button type="button" onClick={() => move(i, -1)} style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', fontSize: 12, color: '#3E4652', cursor: 'pointer', minHeight: 0 }}>← 앞으로</button>}
                    <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', padding: 0, font: 'inherit', fontSize: 12, color: '#B42318', cursor: 'pointer', minHeight: 0 }}>빼기</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {msg && <div role={msg.ok ? 'status' : 'alert'} style={{ fontSize: 13, color: msg.ok ? '#1E5645' : '#B42318' }}>{msg.text}</div>}
      {canEdit ? (
        <button type="button" onClick={save} disabled={saving || !dirty} style={{ alignSelf: 'flex-start', height: 42, padding: '0 20px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: dirty ? 1 : 0.5 }}>
          {saving ? '저장 중…' : '메인 화면 저장'}
        </button>
      ) : (
        <div style={{ fontSize: 13, color: '#9AA3AF' }}>메인 화면은 원장만 바꿀 수 있습니다.</div>
      )}
    </section>
  );
}
