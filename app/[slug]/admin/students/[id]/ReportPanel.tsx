'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ReportSnapshot } from '@/lib/students/report';
import { findHealthWords } from '@/lib/students/labels';
import { formatKstDate } from '@/lib/format-date';
import { ReportView } from '@/components/students/ReportView';
import { smsHref } from '@/lib/messaging/sms-link';

export type ReportRow = { id: string; url: string; periodStart: string; periodEnd: string; createdAt: string; expiresAt: string; status: 'active' | 'expired' | 'revoked'; viewCount: number; lastViewedAt: string | null };

type Props = { slug: string; studentId: string; studentName: string; reports: ReportRow[]; today: string; hasConsent: boolean; parentPhone: string };

const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minWidth: 0, height: 40, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF' };
const BTN: React.CSSProperties = { height: 38, padding: '0 14px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const BTN_GHOST: React.CSSProperties = { ...BTN, background: '#FFFFFF', color: '#1B2430', border: '1px solid #D5D0C6', fontWeight: 500 };
const SMALL: React.CSSProperties = { border: 'none', background: 'none', padding: 0, font: 'inherit', fontSize: 12, cursor: 'pointer', minHeight: 0 };
const STATUS: Record<ReportRow['status'], [string, string, string]> = {
  active: ['공유 중', '#E4EEE9', '#1E5645'],
  expired: ['기간 끝남', '#EEEAE2', '#5A6270'],
  revoked: ['공유 중지', '#FDECEA', '#B42318'],
};

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
function presets(today: string): [string, string, string][] {
  const t = Date.parse(`${today}T00:00:00Z`);
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return [
    ['이번 달', iso(Date.UTC(y, m, 1)), today],
    ['지난 달', iso(Date.UTC(y, m - 1, 1)), iso(Date.UTC(y, m, 0))],
    ['최근 3개월', iso(t - 89 * 86400000), today],
  ];
}


export function ReportPanel({ slug, studentId, studentName, reports, today, hasConsent, parentPhone }: Props) {
  const router = useRouter();
  const api = `/api/${slug}/admin/students/${studentId}/reports`;
  const quick = presets(today);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ periodStart: quick[0][1], periodEnd: quick[0][2], comment: '', includeScores: true, includeAttendance: true });
  const [preview, setPreview] = useState<ReportSnapshot | null>(null);
  const [published, setPublished] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const health = findHealthWords(form.comment);
  const messageFor = (url: string) => `[${studentName} 학생 학습 리포트]\n아래 링크에서 확인하실 수 있습니다. (30일간 열람 가능)\n${url}`;

  function update(patch: Partial<typeof form>) {
    setForm((p) => ({ ...p, ...patch }));
    setPreview(null);
  }

  async function submit(previewOnly: boolean) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, preview: previewOnly }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? '처리하지 못했습니다.');
      if (previewOnly) setPreview(data.snapshot);
      else {
        setPublished(data.url);
        router.refresh();
      }
    } catch {
      setError('처리하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(messageFor(url));
      setCopied(url);
    } catch {
      window.prompt('아래 링크를 복사해 주세요', url);
    }
  }

  async function revoke(id: string) {
    if (!confirm('이 리포트 공유를 중지할까요? 링크가 바로 열리지 않게 됩니다.')) return;
    const res = await fetch(`${api}/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else setError((await res.json().catch(() => ({}))).error ?? '중지하지 못했습니다.');
  }

  function close() {
    setOpen(false);
    setPreview(null);
    setPublished(null);
    setError('');
    setForm((p) => ({ ...p, comment: '' }));
  }

  return (
    <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>학부모 리포트</h2>
        <button type="button" onClick={() => setOpen(true)} disabled={!hasConsent} style={{ ...BTN, height: 34, fontSize: 13, opacity: hasConsent ? 1 : 0.5 }}>+ 만들기</button>
      </div>
      <div style={{ fontSize: 12, color: '#5A6270', lineHeight: 1.6 }}>
        {hasConsent ? '기간의 성적·출결과 선생님 코멘트를 링크로 보냅니다. 관찰 메모·성격 태그는 들어가지 않습니다.' : '학부모 동의 기록이 있어야 리포트를 만들 수 있습니다.'}
      </div>
      {reports.length === 0 && hasConsent && <div style={{ fontSize: 13, color: '#9AA3AF' }}>아직 보낸 리포트가 없습니다.</div>}
      {reports.map((r) => (
        <div key={r.id} style={{ padding: '10px 12px', borderRadius: 8, background: '#F4F2EE', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{r.periodStart.slice(2).replace(/-/g, '.')} ~ {r.periodEnd.slice(2).replace(/-/g, '.')}</span>
            <span style={{ padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: STATUS[r.status][1], color: STATUS[r.status][2] }}>{STATUS[r.status][0]}</span>
          </div>
          <div style={{ fontSize: 12, color: '#5A6270' }}>
            {formatKstDate(r.createdAt)} 발행 · 열람 {r.viewCount}회{r.status === 'active' ? ` · ${formatKstDate(r.expiresAt)}까지` : ''}
          </div>
          {r.status === 'active' && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => copy(r.url)} style={{ ...SMALL, color: '#1E5645', fontWeight: 600 }}>{copied === r.url ? '복사했습니다' : '링크 복사'}</button>
              {parentPhone && <a href={smsHref(parentPhone, messageFor(r.url))} style={{ ...SMALL, color: '#1E5645', fontWeight: 600, textDecoration: 'none' }}>문자로 보내기</a>}
              <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ ...SMALL, color: '#3E4652', textDecoration: 'none' }}>열어 보기 ↗</a>
              <button type="button" onClick={() => revoke(r.id)} style={{ ...SMALL, color: '#B42318' }}>공유 중지</button>
            </div>
          )}
        </div>
      ))}
      {error && !open && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}

      {open && (
        <div role="dialog" aria-modal="true" aria-label="학부모 리포트 만들기" style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(27,36,48,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '24px 12px' }}>
          <div className="adm-sheet" style={{ width: '100%', maxWidth: 720, background: '#FFFFFF', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{published ? '리포트를 발행했습니다' : '학부모 리포트 만들기'}</h2>
              <button type="button" onClick={close} aria-label="닫기" className="adm-sheet-close" style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#5A6270' }}>×</button>
            </div>

            {published ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>아래 링크를 학부모님께 보내 주세요. 30일 동안 열 수 있고, 언제든 &ldquo;공유 중지&rdquo;로 닫을 수 있습니다.</div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F4F2EE', fontSize: 13, wordBreak: 'break-all' }}>{published}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => copy(published)} style={BTN}>{copied === published ? '복사했습니다' : '안내 문구와 함께 복사'}</button>
                  {parentPhone && <a href={smsHref(parentPhone, messageFor(published))} style={{ ...BTN_GHOST, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>문자로 보내기</a>}
                  <a href={published} target="_blank" rel="noopener noreferrer" style={{ ...BTN_GHOST, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>열어 보기 ↗</a>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {quick.map(([label, s, e]) => (
                    <button key={label} type="button" onClick={() => update({ periodStart: s, periodEnd: e })} style={{ ...BTN_GHOST, height: 32, fontSize: 13, background: form.periodStart === s && form.periodEnd === e ? '#1B2430' : '#FFFFFF', color: form.periodStart === s && form.periodEnd === e ? '#FFFFFF' : '#1B2430' }}>{label}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#5A6270' }}>시작일<input type="date" value={form.periodStart} max={today} onChange={(e) => update({ periodStart: e.target.value })} style={INPUT} /></label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#5A6270' }}>종료일<input type="date" value={form.periodEnd} max={today} onChange={(e) => update({ periodEnd: e.target.value })} style={INPUT} /></label>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={form.includeScores} onChange={(e) => update({ includeScores: e.target.checked })} />성적</label>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={form.includeAttendance} onChange={(e) => update({ includeAttendance: e.target.checked })} />출결</label>
                </div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#5A6270' }}>
                  선생님 코멘트 (학부모님이 읽습니다)
                  <textarea value={form.comment} onChange={(e) => update({ comment: e.target.value })} maxLength={1500} rows={5} placeholder="이번 기간 수업 모습, 잘한 점, 앞으로 함께 신경 쓸 점을 적어 주세요." style={{ ...INPUT, height: 'auto', padding: '10px 12px', lineHeight: 1.7, resize: 'vertical', color: '#1B2430' }} />
                  <span style={{ alignSelf: 'flex-end', fontSize: 12, color: '#9AA3AF' }}>{form.comment.length}/1500</span>
                </label>
                {health.length > 0 && (
                  <div role="note" style={{ padding: '8px 12px', borderRadius: 8, background: '#FFF7E6', fontSize: 13, lineHeight: 1.6 }}>⚠️ 건강·질병 정보로 보이는 표현이 있습니다({health.join(', ')}). 학부모에게 보내는 글에도 건강 정보는 넣지 않는 것이 안전합니다.</div>
                )}
                {error && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{error}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => submit(true)} disabled={busy || !form.comment.trim()} style={{ ...BTN_GHOST, opacity: form.comment.trim() ? 1 : 0.5 }}>미리보기</button>
                  <button type="button" onClick={() => submit(false)} disabled={busy || !preview} title={preview ? '' : '미리보기를 먼저 확인해 주세요'} style={{ ...BTN, opacity: preview ? 1 : 0.5 }}>발행하고 링크 만들기</button>
                </div>
                {!preview && <div style={{ fontSize: 12, color: '#9AA3AF' }}>미리보기로 학부모님이 보실 화면을 확인한 뒤 발행할 수 있습니다.</div>}
                {preview && (
                  <div style={{ border: '1px dashed #B7B0A2', borderRadius: 12, padding: 12, background: '#F6F5F2' }}>
                    <div style={{ fontSize: 12, color: '#5A6270', marginBottom: 8 }}>미리보기 — 학부모님 화면</div>
                    <ReportView snapshot={preview} preview />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
