'use client';

import { useState } from 'react';

interface MonthStat {
  month: string;
  label: string;
  leads: number;
  enrolled: number;
}

interface SearchKeyword {
  keyword: string;
  count: number;
}

/** AI 검색(ChatGPT·Perplexity·Gemini 답변의 링크)으로 들어와 상담을 신청한 수 — 유입 경로로 자동 집계 */
interface AiInflow {
  month: { name: string; count: number }[];
  sixMonths: number;
  sixMonthsEnrolled: number;
}

interface Props {
  slug: string;
  month: string;
  monthLabel: string;
  history: MonthStat[];
  keywords: SearchKeyword[];
  aiInflow: AiInflow;
  managerNote: string | null;
  messageSentCount: number;
}

export function ReportClient({ slug, month, monthLabel, history, keywords, aiInflow, managerNote: initialNote, messageSentCount }: Props) {
  const [note, setNote] = useState(initialNote ?? '');
  const [noteSaving, setNoteSaving] = useState(false);
  const [kakaoSending, setKakaoSending] = useState(false);
  const [kakaoResult, setKakaoResult] = useState<string | null>(null);

  const maxLeads = Math.max(...history.map((h) => h.leads), 1);
  const current = history[history.length - 1];
  const conversionRate = current.leads > 0
    ? Math.round((current.enrolled / current.leads) * 100)
    : null;

  async function sendKakaoSummary() {
    setKakaoSending(true);
    setKakaoResult(null);
    try {
      const res = await fetch(`/api/${slug}/admin/report/${month}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setKakaoResult(data.sent === 0 ? '수신자가 없습니다.' : `${data.sent}명에게 발송 완료`);
      } else {
        setKakaoResult(data.error ?? '발송 실패');
      }
    } catch {
      setKakaoResult('네트워크 오류');
    } finally {
      setKakaoSending(false);
    }
  }

  async function saveNote() {
    setNoteSaving(true);
    try {
      await fetch(`/api/${slug}/admin/report/${month}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerNote: note }),
      });
    } finally {
      setNoteSaving(false);
    }
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @media print {
          body { background: #fff !important; }
          [data-print-hide] { display: none !important; }
          [data-print-root] { padding: 0 !important; }
          @page { size: A4; margin: 20mm; }
        }
      `}</style>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{monthLabel} 리포트</h1>
          <div style={{ fontSize: 14, color: '#5A6270', marginTop: 4 }}>한 달 상담·등록 흐름과 유입 경로를 봅니다. 매월 1일 알림 번호로 카카오톡 요약본이 발송됩니다.</div>
        </div>
        <div data-print-hide style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          {kakaoResult && (
            <span style={{ fontSize: 13, color: '#1E5645', fontWeight: 600 }}>{kakaoResult}</span>
          )}
          <button
            type="button"
            disabled={kakaoSending}
            onClick={sendKakaoSummary}
            style={{ height: 44, padding: '0 18px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: kakaoSending ? 'wait' : 'pointer', opacity: kakaoSending ? 0.6 : 1 }}
          >
            {kakaoSending ? '발송 중…' : '카카오 요약 발송'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ height: 44, padding: '0 18px', border: '1px solid #D5D0C6', borderRadius: 8, background: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            PDF 저장 (인쇄)
          </button>
        </div>
      </div>

      {/* KPI 요약 타일 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: '이달 상담 신청', value: current.leads, unit: '건' },
          { label: '이달 등록', value: current.enrolled, unit: '명' },
          { label: '전환율', value: conversionRate !== null ? `${conversionRate}%` : '—', unit: '' },
          { label: '카카오 발송', value: messageSentCount, unit: '건' },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ padding: '18px 20px', background: '#FFFFFF', borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#5A6270', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {value}<span style={{ fontSize: 15, fontWeight: 400, marginLeft: 4 }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top row: chart + keywords */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 6-month chart */}
        <div style={{ flex: 1, padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>최근 6개월 상담 신청·등록</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#9FBFB2', marginRight: 6 }} />상담 신청</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#1E5645', marginRight: 6 }} />등록</span>
            </div>
          </div>

          {/* bars */}
          <div style={{ height: 220, display: 'grid', gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))`, gap: 16, alignItems: 'end', borderBottom: '1px solid #D5D0C6' }}>
            {history.map((h) => {
              const leadsH = Math.round((h.leads / maxLeads) * 210);
              const enrollH = h.leads > 0 ? Math.round((h.enrolled / h.leads) * leadsH) : 0;
              return (
                <div key={h.month} style={{ display: 'flex', gap: 4, alignItems: 'flex-end', justifyContent: 'center', height: 220 }}>
                  <div style={{ width: 28, height: Math.max(leadsH, 4), background: '#9FBFB2', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ width: 28, height: Math.max(enrollH, 4), background: '#1E5645', borderRadius: '4px 4px 0 0' }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))`, gap: 16, fontSize: 13, color: '#5A6270', textAlign: 'center' }}>
            {history.map((h, i) => (
              <span key={h.month} style={i === history.length - 1 ? { color: '#1B2430', fontWeight: 700 } : undefined}>
                {h.label} {h.leads}·{h.enrolled}
              </span>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div style={{ width: 400, padding: 24, boxSizing: 'border-box', background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>상담으로 이어진 검색어</div>
          {keywords.length === 0 && (
            <div style={{ fontSize: 14, color: '#9AA3AF' }}>아직 수집된 검색어가 없습니다.</div>
          )}
          {keywords.map((kw) => (
            <div key={kw.keyword} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EEEAE2', fontSize: 14 }}>
              <span>{kw.keyword}</span>
              <b>{kw.count}건</b>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row: AI check + manager note */}
      <div style={{ display: 'flex', gap: 16, flex: 1 }}>
        {/* AI 검색 유입 (자동 집계) */}
        <div style={{ flex: 1, padding: 24, background: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>AI 검색으로 들어온 상담</div>
            <div style={{ fontSize: 13, color: '#5A6270', marginTop: 2 }}>학부모가 ChatGPT·Perplexity·Gemini 답변의 링크로 들어와 상담을 신청한 수입니다.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>{aiInflow.month.reduce((t, e) => t + e.count, 0)}건</span>
            <span style={{ fontSize: 13, color: '#5A6270' }}>이번 달</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {aiInflow.month.map((e) => (
                <tr key={e.name} style={{ borderTop: '1px solid #EEEAE2' }}>
                  <td style={{ padding: '10px 0' }}>{e.name}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600 }}>{e.count}건</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 13, color: '#5A6270', lineHeight: 1.6 }}>
            최근 6개월 {aiInflow.sixMonths}건{aiInflow.sixMonths > 0 ? ` · 그중 등록 ${aiInflow.sixMonthsEnrolled}건` : ''}.
            학원 정보·교습비·FAQ를 빠짐없이 채울수록 AI가 학원을 더 정확하게 소개합니다.
          </div>
        </div>

        {/* Manager note */}
        <div style={{ width: 520, padding: 24, boxSizing: 'border-box', background: '#1E5645', color: '#FFFFFF', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>다음 달 제안</div>
          <div style={{ fontSize: 13, color: '#B8D4CA' }}>관리 담당자가 매월 직접 작성합니다.</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={'1. 반 증설 검토&#10;2. 체험수업 안내 계속&#10;3. 후기 동의 확인 요청'}
            style={{ flex: 1, minHeight: 120, padding: 12, border: '1px solid #2E7060', borderRadius: 8, background: '#175240', color: '#FFFFFF', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.85, resize: 'vertical' }}
          />
          <button
            type="button"
            onClick={saveNote}
            disabled={noteSaving}
            style={{ alignSelf: 'flex-start', height: 36, padding: '0 16px', border: 'none', borderRadius: 8, background: '#FFFFFF', color: '#1E5645', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: noteSaving ? 'wait' : 'pointer' }}
          >
            {noteSaving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
