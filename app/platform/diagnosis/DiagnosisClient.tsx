'use client';

import { smsHref } from '@/lib/messaging/sms-link';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatKstDate } from '@/lib/format-date';
import { diagnosisText, maskEmailAddr } from '@/lib/diagnosis/result-mail';

type DiagRequest = {
  id: string;
  academyName: string;
  area: string;
  subject: string;
  phone: string | null;
  email: string | null;
  currentUrl: string | null;
  status: string;
  resultNote: string | null;
  scores: DiagScores | null;
  createdAt: string;
};

type DiagItemScore = { score: 1 | 2 | 3; note: string };
type DiagScores = {
  homepage: DiagItemScore;
  seo: DiagItemScore;
  conversion: DiagItemScore;
  mobile: DiagItemScore;
};

const DIAG_ITEMS: { key: keyof DiagScores; label: string; desc: string }[] = [
  { key: 'homepage', label: '홈페이지 현황', desc: '현재 홈페이지의 정보 품질·디자인' },
  { key: 'seo', label: 'SEO 노출도', desc: '검색 노출·메타태그·구조화 데이터' },
  { key: 'conversion', label: '상담 전환 구조', desc: '상담 신청 경로·CTA 배치' },
  { key: 'mobile', label: '모바일 최적화', desc: '모바일 레이아웃·속도·UX' },
];

const SCORE_OPTIONS: { value: 1 | 2 | 3; label: string; bg: string; color: string }[] = [
  { value: 1, label: '미흡', bg: '#FCE4DC', color: '#8A3A1C' },
  { value: 2, label: '보통', bg: '#FBF1CF', color: '#5A4A12' },
  { value: 3, label: '양호', bg: '#D8E8E0', color: '#1E5645' },
];

function defaultScores(): DiagScores {
  return {
    homepage: { score: 2, note: '' },
    seo: { score: 2, note: '' },
    conversion: { score: 2, note: '' },
    mobile: { score: 2, note: '' },
  };
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '대기 중' },
  { value: 'in_review', label: '검토 중' },
  { value: 'done', label: '완료' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FBF1CF', color: '#5A4A12' },
  in_review: { bg: '#D8E8E0', color: '#1E5645' },
  done: { bg: '#E6E9EE', color: '#2C3747' },
};

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})-?\d{4}-?(\d{4})/, '$1-****-$2');
}

/** 목록: 이메일(새 신청) 또는 휴대폰(예전 신청)을 가려서 */
function maskedContact(r: DiagRequest) {
  if (r.email) return maskEmailAddr(r.email);
  return r.phone ? maskPhone(r.phone) : '—';
}


export function DiagnosisClient({ requests }: { requests: DiagRequest[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<DiagRequest | null>(null);
  const [status, setStatus] = useState('');
  const [resultNote, setResultNote] = useState('');
  const [scores, setScores] = useState<DiagScores>(defaultScores());
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'sent' | 'error' | null>(null);
  const [sendError, setSendError] = useState('');
  const [error, setError] = useState('');

  function openPanel(r: DiagRequest) {
    setSelected(r);
    setStatus(r.status);
    setResultNote(r.resultNote ?? '');
    setScores(r.scores ?? defaultScores());
    setError('');
    setSendResult(null);
  }

  function setItemScore(key: keyof DiagScores, field: 'score' | 'note', value: number | string) {
    setScores((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/platform/diagnosis/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resultNote, scores }),
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

  async function sendResultMail() {
    if (!selected) return;
    setSending(true);
    setSendResult(null);
    setSendError('');
    try {
      const res = await fetch(`/api/platform/diagnosis/${selected.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultNote, scores }),
      });
      if (res.ok) {
        setSendResult('sent');
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setSendError(d.error ?? '');
        setSendResult('error');
      }
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
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
              <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>학원명</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>지역</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>과목</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>이메일·연락처</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>현재 URL</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>상태</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#5A6270' }}>신청일</th>
              <th style={{ padding: '12px 16px' }}></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const st = STATUS_STYLE[r.status] ?? { bg: '#F0F1F3', color: '#3C4659' };
              const stLabel = STATUS_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status;
              return (
                <tr
                  key={r.id}
                  onClick={() => openPanel(r)}
                  style={{
                    borderBottom: '1px solid #F0EDE7',
                    background: selected?.id === r.id ? '#F4FAF7' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{r.academyName}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{r.area}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{r.subject}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270' }}>{maskedContact(r)}</td>
                  <td style={{ padding: '14px 16px', color: '#5A6270', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.currentUrl ? (
                      <a href={r.currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D3FA8', fontSize: 12 }}>
                        {r.currentUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{stLabel}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#8A93A8', fontSize: 13 }}>
                    {formatKstDate(r.createdAt)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openPanel(r); }}
                      style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1E5645', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      처리
                    </button>
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#9AA3AF' }}>접수된 진단 신청이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Side panel */}
      {selected && (
        <div
          className="adm-sheet"
          style={{
            width: 360,
            padding: 24,
            background: '#FFFFFF',
            borderRadius: 12,
            alignSelf: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 24,
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.academyName}</div>
            <button
              onClick={() => setSelected(null)}
              aria-label="닫기"
              className="adm-sheet-close"
              style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9AA3AF', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.7 }}>
            <div>{selected.subject} · {selected.area}</div>
            {selected.email && <div>이메일: {selected.email}</div>}
            {selected.phone && <div>연락처: {selected.phone} <span style={{ color: '#9AA3AF' }}>(예전 신청)</span></div>}
            {selected.currentUrl && (
              <div>
                URL:{' '}
                <a href={selected.currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D3FA8' }}>
                  {selected.currentUrl}
                </a>
              </div>
            )}
            <div>신청: {formatKstDate(selected.createdAt)}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>진행 상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 4-item scoring */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>진단 항목 (4개)</div>
            {DIAG_ITEMS.map((item) => (
              <div key={item.key} style={{ padding: 12, background: '#FAF9F6', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#5A6270' }}>{item.desc}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SCORE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setItemScore(item.key, 'score', opt.value)}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 6,
                        border: scores[item.key].score === opt.value ? '2px solid #1E5645' : '1px solid #D5D0C6',
                        background: scores[item.key].score === opt.value ? opt.bg : '#FFFFFF',
                        color: scores[item.key].score === opt.value ? opt.color : '#3E4652',
                        fontSize: 13,
                        fontWeight: scores[item.key].score === opt.value ? 700 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={scores[item.key].note}
                  onChange={(e) => setItemScore(item.key, 'note', e.target.value)}
                  placeholder="간단 메모 (선택)"
                  style={{ height: 34, padding: '0 10px', border: '1px solid #D5D0C6', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              추가 메모 <span style={{ fontWeight: 400, color: '#9AA3AF' }}>(내부용)</span>
            </label>
            <textarea
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              rows={4}
              placeholder="경쟁 학원, 제안 방향 등..."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          {/* 결과 안내 미리보기 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{selected.email ? '보낼 메일 미리보기' : '보낼 문자 미리보기'} <span style={{ fontWeight: 400, color: '#9AA3AF' }}>(추가 메모는 들어가지 않습니다)</span></div>
            <div style={{ padding: 14, borderRadius: 10, background: '#FAF9F6', border: '1px solid #E2DDD2', fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#1B2430', maxHeight: 200, overflowY: 'auto' }}>
              {diagnosisText(selected, scores, '')}
            </div>
          </div>

          {sendResult === 'sent' && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#D8E8E0', color: '#1E5645', fontSize: 13, fontWeight: 600 }}>
              {selected.email ? '결과 메일을 보내고 완료로 표시했습니다' : '처리 완료로 표시했습니다'}
            </div>
          )}
          {sendResult === 'error' && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FDE8E8', color: '#B91C1C', fontSize: 13 }}>
              {sendError || '처리하지 못했습니다. 다시 시도해 주세요.'}
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FDE8E8', color: '#B91C1C', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {selected.email ? (
              <button
                type="button"
                onClick={sendResultMail}
                disabled={sending}
                style={{ flex: 1, height: 44, borderRadius: 8, background: '#1E5645', color: '#FFFFFF', border: 'none', fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {sending ? '보내는 중…' : sendResult === 'sent' ? '메일 다시 보내기' : '결과 메일 보내기'}
              </button>
            ) : selected.phone ? (
              <a
                href={smsHref(selected.phone, diagnosisText(selected, scores, ''))}
                onClick={() => { sendResultMail(); }}
                style={{ flex: 1, height: 44, borderRadius: 8, background: '#1E5645', color: '#FFFFFF', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sending ? 0.6 : 1 }}
              >
                {sendResult === 'sent' ? '문자 다시 보내기' : '문자 보내기'}
              </a>
            ) : null}
            <button
              onClick={save}
              disabled={saving}
              style={{
                flex: 1,
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
        </div>
      )}
    </div>
  );
}
