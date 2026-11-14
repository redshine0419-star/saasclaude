'use client';

import { useState } from 'react';
import type { ConsentItem } from '@/lib/legal/consents';

type Props = {
  items: ConsentItem[];
  values: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  /** 전체 동의 줄 문구 */
  allLabel?: string;
  idPrefix?: string;
};

/**
 * 동의 묶음 — 전체 동의 + 항목별 (필수)/(선택) 체크와 "보기"로 펼치는 전문(표·문단·약관).
 * 학원 홈페이지(테마 토큰)와 더클 화면 모두에서 쓰도록 색은 CSS 변수 + 기본값으로 정한다.
 */
export function ConsentList({ items, values, onChange, allLabel = '아래 내용에 모두 동의합니다. (선택 항목 포함)', idPrefix = 'c' }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const visible = items.filter((i) => !i.dependsOn || values[i.dependsOn]);
  const all = visible.every((i) => values[i.key]);

  function set(key: string, v: boolean) {
    const next = { ...values, [key]: v };
    // 상위 항목을 끄면 딸린 항목도 끈다 (예: 광고성 수신을 끄면 야간 수신도)
    for (const i of items) if (i.dependsOn === key && !v) next[i.key] = false;
    onChange(next);
  }
  function setAll(v: boolean) {
    const next = { ...values };
    for (const i of items) next[i.key] = v;
    onChange(next);
  }

  const line = 'var(--line, #E5E7EB)';
  const sub = 'var(--body, #4A5568)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${line}`, borderRadius: 12, overflow: 'hidden', background: 'var(--surface, #FFFFFF)', color: 'var(--ink, #1B2430)' }}>
      <label htmlFor={`${idPrefix}-all`} style={{ display: 'flex', flexWrap: 'nowrap', gap: 10, alignItems: 'center', padding: '14px 16px', background: 'var(--subtle, #F3F5F8)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        <input id={`${idPrefix}-all`} type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} style={{ width: 19, height: 19, margin: 0, flexShrink: 0 }} />
        {allLabel}
      </label>
      {visible.map((c) => {
        const hasMore = !!(c.table || c.text?.length || c.sections?.length);
        const isOpen = open === c.key;
        return (
          <div key={c.key} style={{ borderTop: `1px solid ${line}`, padding: c.dependsOn ? '10px 16px 10px 40px' : '10px 16px' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'flex-start', gap: 10 }}>
              <label htmlFor={`${idPrefix}-${c.key}`} style={{ display: 'flex', flexWrap: 'nowrap', gap: 10, alignItems: 'flex-start', flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.55, cursor: 'pointer' }}>
                <input id={`${idPrefix}-${c.key}`} type="checkbox" checked={!!values[c.key]} onChange={(e) => set(c.key, e.target.checked)} style={{ width: 18, height: 18, margin: '1px 0 0', flexShrink: 0 }} />
                <span>
                  <b style={{ fontWeight: 700, color: c.required ? 'var(--accent, #1E5645)' : sub }}>({c.required ? '필수' : '선택'})</b> {c.label}
                </span>
              </label>
              {hasMore && (
                <button type="button" onClick={() => setOpen(isOpen ? null : c.key)} aria-expanded={isOpen} aria-controls={`${idPrefix}-${c.key}-body`} style={{ flexShrink: 0, border: 'none', background: 'none', padding: '2px 0', font: 'inherit', fontSize: 13, color: sub, cursor: 'pointer', textDecoration: 'underline' }}>
                  {isOpen ? '접기' : '보기'}
                </button>
              )}
            </div>
            {hasMore && isOpen && (
              <div id={`${idPrefix}-${c.key}-body`} style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto', padding: '10px 12px', borderRadius: 8, background: 'var(--subtle, #F7F8FA)', fontSize: 13, lineHeight: 1.7, color: sub }}>
                {c.table && (
                  <div style={{ overflowX: 'auto', marginBottom: c.text?.length ? 8 : 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, background: 'var(--surface, #FFFFFF)' }}>
                      <thead>
                        <tr>{c.table.head.map((h) => <th key={h} style={{ border: `1px solid ${line}`, padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--ink, #1B2430)' }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {c.table.rows.map((r, i) => (
                          <tr key={i}>{r.map((v, j) => <td key={j} style={{ border: `1px solid ${line}`, padding: '6px 8px', verticalAlign: 'top' }}>{v}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {c.text?.map((t, i) => <p key={i} style={{ margin: i ? '6px 0 0' : 0 }}>{t}</p>)}
                {c.sections?.map((s) => (
                  <div key={s.title} style={{ marginTop: 10 }}>
                    <b style={{ color: 'var(--ink, #1B2430)' }}>{s.title}</b>
                    {s.body.map((t, i) => <p key={i} style={{ margin: '3px 0 0' }}>{t}</p>)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
