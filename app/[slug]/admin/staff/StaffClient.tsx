'use client';

import { useState } from 'react';

interface StaffMember {
  id: string;
  name: string;
  roleLabel: string | null;
  photo: string | null;
  summary: string | null;
  sortOrder: number;
}

interface Props {
  slug: string;
  initialStaff: StaffMember[];
}

export function StaffClient({ slug, initialStaff }: Props) {
  const [staff, setStaff] = useState(initialStaff);
  const [selectedId, setSelectedId] = useState<string | null>(initialStaff[0]?.id ?? null);
  const [form, setForm] = useState<Partial<StaffMember>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', roleLabel: '', summary: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  async function uploadPhoto(id: string, file: File) {
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch(`/api/${slug}/admin/upload`, { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) return;
      const res = await fetch(`/api/${slug}/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: uploadData.url }),
      });
      if (res.ok) {
        const data = await res.json();
        setStaff((prev) => prev.map((s) => s.id === id ? { ...s, ...data.staff } : s));
      }
    } finally {
      setPhotoUploading(false);
    }
  }

  const selected = staff.find((s) => s.id === selectedId) ?? null;

  function fieldVal<K extends keyof StaffMember>(key: K): StaffMember[K] {
    return ((form as Partial<StaffMember>)[key] as StaffMember[K]) ?? (selected?.[key] as StaffMember[K]);
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/staff/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fieldVal('name'),
          roleLabel: fieldVal('roleLabel'),
          summary: fieldVal('summary'),
          photo: fieldVal('photo'),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStaff((prev) => prev.map((s) => s.id === selectedId ? { ...s, ...data.staff } : s));
        setForm({});
      }
    } finally {
      setSaving(false);
    }
  }

  async function add() {
    if (!newForm.name) return;
    setAddSaving(true);
    try {
      const res = await fetch(`/api/${slug}/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        const data = await res.json();
        setStaff((prev) => [...prev, data.staff]);
        setSelectedId(data.staff.id);
        setShowAdd(false);
        setNewForm({ name: '', roleLabel: '', summary: '' });
      }
    } finally {
      setAddSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/${slug}/admin/staff/${id}`, { method: 'DELETE' });
    setStaff((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(staff.find((s) => s.id !== id)?.id ?? null);
  }

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button type="button" onClick={() => setShowAdd(true)} style={{ alignSelf: 'flex-start', height: 44, padding: '0 18px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + 강사 추가
        </button>
        {staff.length === 0 && !showAdd && (
          <div style={{ padding: 48, background: '#FFFFFF', borderRadius: 12, textAlign: 'center', color: '#9AA3AF', fontSize: 14 }}>
            등록된 강사가 없습니다.
          </div>
        )}
        {staff.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            style={{ padding: 20, background: '#FFFFFF', border: selectedId === s.id ? '2px solid #1E5645' : '1px solid #E2DDD2', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
          >
            {s.photo ? (
              <img src={s.photo} alt={s.name} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 24, background: '#E2DDD2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👤</div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: '#5A6270', marginTop: 2 }}>{s.roleLabel ?? '역할 미기재'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit panel */}
      <div style={{ width: 440, padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'flex-start' }}>
        {showAdd ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 700 }}>강사 추가</div>
            {(['name', 'roleLabel', 'summary'] as const).map((key) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>
                  {key === 'name' ? '이름 *' : key === 'roleLabel' ? '역할·직함' : '소개'}
                </label>
                {key === 'summary' ? (
                  <textarea
                    value={newForm[key]}
                    onChange={(e) => setNewForm((p) => ({ ...p, [key]: e.target.value }))}
                    rows={3}
                    style={{ padding: 12, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'none' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={newForm[key]}
                    onChange={(e) => setNewForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={key === 'name' ? '홍길동' : key === 'roleLabel' ? '수학 전담' : ''}
                    style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                  />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, height: 48, border: '1px solid #D5D0C6', borderRadius: 10, background: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' }}>취소</button>
              <button type="button" onClick={add} disabled={addSaving || !newForm.name} style={{ flex: 2, height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: addSaving ? 'wait' : 'pointer' }}>저장</button>
            </div>
          </>
        ) : selected ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 700 }}>강사 편집</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {selected.photo
                ? <img src={selected.photo} alt={selected.name} style={{ width: 56, height: 56, borderRadius: 28, objectFit: 'cover' }} />
                : <div style={{ width: 56, height: 56, borderRadius: 28, background: '#E2DDD2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👤</div>
              }
              <label style={{ height: 36, padding: '0 14px', border: '1px solid #D5D0C6', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: photoUploading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                {photoUploading ? '업로드 중…' : '사진 변경'}
                <input type="file" accept="image/*" disabled={photoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f && selected) uploadPhoto(selected.id, f); e.target.value = ''; }} style={{ display: 'none' }} />
              </label>
            </div>
            {(['name', 'roleLabel', 'summary'] as const).map((key) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A6270' }}>
                  {key === 'name' ? '이름' : key === 'roleLabel' ? '역할·직함' : '소개'}
                </label>
                {key === 'summary' ? (
                  <textarea
                    value={(fieldVal(key) as string) ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    rows={3}
                    style={{ padding: 12, border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'none' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={(fieldVal(key) as string) ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    style={{ height: 44, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14 }}
                  />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button type="button" onClick={() => remove(selected.id)} style={{ height: 48, padding: '0 20px', border: '1px solid #D5D0C6', borderRadius: 10, background: '#FFFFFF', font: 'inherit', fontSize: 14, color: '#8A3A1C', cursor: 'pointer' }}>삭제</button>
              <button type="button" onClick={save} disabled={saving} style={{ flex: 1, height: 48, border: 'none', borderRadius: 10, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 15, fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>저장</button>
            </div>
          </>
        ) : (
          <div style={{ color: '#9AA3AF', fontSize: 14, padding: 24, textAlign: 'center' }}>왼쪽 목록에서 강사를 선택하거나 추가하세요.</div>
        )}
      </div>
    </div>
  );
}
