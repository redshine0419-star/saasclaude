'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SECTION_COPY_SPEC, TITLE_MAX, type CopyItem, type SectionCopy } from '@/lib/section-copy';

type Props = { slug: string; sectionKeys: string[]; labels: Record<string, string>; initial: SectionCopy; canEdit: boolean };

const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minWidth: 0, padding: '8px 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF', lineHeight: 1.5 };
const SMALL: React.CSSProperties = { border: 'none', background: 'none', padding: 0, font: 'inherit', fontSize: 12, cursor: 'pointer', minHeight: 0 };

export function SectionCopyEditor({ slug, sectionKeys, labels, initial, canEdit }: Props) {
  const router = useRouter();
  const keys = sectionKeys.filter((k) => SECTION_COPY_SPEC[k]);
  const [copy, setCopy] = useState<SectionCopy>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(copy) !== JSON.stringify(initial);

  function setTitle(key: string, title: string) {
    setCopy((c) => ({ ...c, [key]: { ...c[key], title: title.split('\n').slice(0, 2).join('\n') } }));
    setMsg(null);
  }
  function setItems(key: string, items: CopyItem[] | undefined) {
    setCopy((c) => ({ ...c, [key]: { ...c[key], items } }));
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/${slug}/admin/section-copy`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sectionCopy: copy }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: data.error ?? '저장하지 못했습니다.' });
      setCopy(data.sectionCopy);
      setMsg({ ok: true, text: '저장했습니다. 홈페이지에 바로 반영됩니다.' });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: '저장하지 못했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  if (keys.length === 0) return null;

  return (
    <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>섹션 문구</h2>
      <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.6 }}>각 섹션의 제목과 카드 내용을 바꿀 수 있습니다. 비워 두면 회색 글씨의 기본 문구가 보입니다.</div>

      <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #EEEAE2', borderRadius: 10, overflow: 'hidden' }}>
        {keys.map((key, idx) => {
          const spec = SECTION_COPY_SPEC[key];
          const entry = copy[key] ?? {};
          const isOpen = open === key;
          const customized = !!entry.title || !!entry.items?.length;
          const items = entry.items ?? [];
          const itemSpec = spec.items;
          return (
            <div key={key} style={{ borderTop: idx ? '1px solid #EEEAE2' : 'none' }}>
              <button type="button" onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '12px 14px', border: 'none', background: isOpen ? '#FAF9F6' : '#FFFFFF', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{labels[key] ?? key}</span>
                  <span style={{ display: 'block', fontSize: 12, color: '#5A6270', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(entry.title || spec.title).replace('\n', ' ')}</span>
                </span>
                <span style={{ flexShrink: 0, fontSize: 12, color: customized ? '#1E5645' : '#9AA3AF', fontWeight: 600 }}>{customized ? '편집함' : '기본'} {isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={{ padding: '4px 14px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FAF9F6' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#5A6270', fontWeight: 600 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}>제목 (2줄까지)<span style={{ fontWeight: 400 }}>{(entry.title ?? '').length}/{TITLE_MAX}</span></span>
                    <textarea value={entry.title ?? ''} disabled={!canEdit} maxLength={TITLE_MAX} rows={2} placeholder={spec.title} onChange={(e) => setTitle(key, e.target.value)} style={{ ...INPUT, resize: 'none', color: '#1B2430', fontWeight: 400 }} />
                  </label>

                  {itemSpec && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 13, color: '#5A6270', fontWeight: 600 }}>카드 항목 (최대 {itemSpec.max}개)</div>
                      {itemSpec.hint && <div role="note" style={{ padding: '8px 10px', borderRadius: 8, background: '#FFF7E6', fontSize: 12, lineHeight: 1.6 }}>⚠️ {itemSpec.hint}</div>}
                      {items.length === 0 && (
                        <div style={{ fontSize: 12, color: '#9AA3AF', lineHeight: 1.6 }}>
                          {itemSpec.publishDefaults ? '입력한 항목이 없어 아래 기본 항목이 보입니다.' : '입력한 항목이 없어 홈페이지에 보이지 않습니다.'}
                          <div style={{ marginTop: 4 }}>{itemSpec.defaults.map((d) => `${d.code ? `${d.code} ` : ''}${d.title}`).join(' · ')}</div>
                        </div>
                      )}
                      {items.map((it, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: itemSpec.code ? '80px minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: 6, padding: 10, borderRadius: 8, background: '#FFFFFF', border: '1px solid #EEEAE2' }}>
                          {itemSpec.code && <input value={it.code ?? ''} disabled={!canEdit} maxLength={itemSpec.code} placeholder={itemSpec.labels.code} onChange={(e) => setItems(key, items.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} style={INPUT} />}
                          <input value={it.title} disabled={!canEdit} maxLength={itemSpec.title} placeholder={itemSpec.labels.title} onChange={(e) => setItems(key, items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} style={INPUT} />
                          <textarea value={it.body} disabled={!canEdit} maxLength={itemSpec.body} rows={2} placeholder={itemSpec.labels.body} onChange={(e) => setItems(key, items.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} style={{ ...INPUT, gridColumn: '1 / -1', resize: 'vertical' }} />
                          {canEdit && (
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
                              {i > 0 && <button type="button" onClick={() => setItems(key, items.map((x, j) => (j === i - 1 ? items[i] : j === i ? items[i - 1] : x)))} style={{ ...SMALL, color: '#3E4652' }}>↑ 위로</button>}
                              <button type="button" onClick={() => setItems(key, items.filter((_, j) => j !== i))} style={{ ...SMALL, color: '#B42318' }}>삭제</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {items.length < itemSpec.max && (
                            <button type="button" onClick={() => setItems(key, [...items, { ...(itemSpec.code ? { code: '' } : {}), title: '', body: '' }])} style={{ ...SMALL, fontSize: 13, color: '#1E5645', fontWeight: 700 }}>+ 항목 추가</button>
                          )}
                          {items.length === 0 && (
                            <button type="button" onClick={() => setItems(key, itemSpec.defaults.map((d) => ({ ...d })))} style={{ ...SMALL, fontSize: 13, color: '#3E4652' }}>
                              {itemSpec.publishDefaults ? '기본 항목을 불러와 고치기' : '예시를 불러와 고치기 (사실인 것만 남기세요)'}
                            </button>
                          )}
                          {items.length > 0 && itemSpec.publishDefaults && (
                            <button type="button" onClick={() => setItems(key, undefined)} style={{ ...SMALL, fontSize: 13, color: '#9AA3AF' }}>기본 항목으로 되돌리기</button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {msg && <div role={msg.ok ? 'status' : 'alert'} style={{ fontSize: 13, color: msg.ok ? '#1E5645' : '#B42318' }}>{msg.text}</div>}
      {canEdit ? (
        <button type="button" onClick={save} disabled={saving || !dirty} style={{ alignSelf: 'flex-start', height: 42, padding: '0 20px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: dirty ? 1 : 0.5 }}>
          {saving ? '저장 중…' : '섹션 문구 저장'}
        </button>
      ) : (
        <div style={{ fontSize: 13, color: '#9AA3AF' }}>섹션 문구는 원장만 바꿀 수 있습니다.</div>
      )}
    </section>
  );
}
