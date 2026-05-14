'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search, Link2, Link2Off, Loader2, AlertTriangle, TrendingUp, TrendingDown,
  Target, Zap, ExternalLink, ChevronDown, ChevronUp, Info,
} from 'lucide-react';

// ── UI primitives ──────────────────────────────────────────────────────────
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>{children}</div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{children}</div>
);

// ── Types ──────────────────────────────────────────────────────────────────
interface GSCStatus {
  connected: boolean;
  email?: string;
  sites?: { siteUrl: string; label: string; isDomain: boolean }[];
}

interface AIOverviewCandidate {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  prevCtr: number;
  prevImpressions: number;
  prevPosition: number;
  ctrDrop: number;
  impChange: number;
}

interface Query {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  potentialClicks?: number;
  uplift?: number;
}

interface Page {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCTotals {
  clicks: number;
  impressions: number;
  avgCtr: number;
  avgPosition: number;
}

interface GSCData {
  period: { startDate: string; endDate: string };
  comparePeriod: { startDate: string; endDate: string } | null;
  totals: GSCTotals;
  compTotals: GSCTotals | null;
  pages: Page[];
  queries: Query[];
  aiOverviewCandidates: AIOverviewCandidate[];
  nearMissQueries: Query[];
  ctrOpportunities: Query[];
}

// ── Date helpers ───────────────────────────────────────────────────────────
function fmt(d: Date) { return d.toISOString().slice(0, 10); }
function ago(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

const PERIOD_PRESETS = [
  {
    label: '최근 28일 vs 이전 28일',
    current: { start: fmt(ago(28)), end: fmt(ago(1)) },
    compare: { start: fmt(ago(56)), end: fmt(ago(29)) },
  },
  {
    label: '최근 28일 vs 전년 동기',
    current: { start: fmt(ago(28)), end: fmt(ago(1)) },
    compare: { start: fmt(ago(28 + 365)), end: fmt(ago(1 + 365)) },
  },
  {
    label: '최근 90일 vs 전년 동기',
    current: { start: fmt(ago(90)), end: fmt(ago(1)) },
    compare: { start: fmt(ago(90 + 365)), end: fmt(ago(1 + 365)) },
  },
];

// ── Formatter helpers ──────────────────────────────────────────────────────
const fmtNum = (n: number) => n >= 10000 ? (n / 1000).toFixed(1) + 'k' : n.toLocaleString();
const fmtCtr = (n: number) => (n * 100).toFixed(1) + '%';
const fmtPos = (n: number) => n.toFixed(1);
const shortPage = (url: string) => {
  try { return new URL(url).pathname || '/'; } catch { return url; }
};

function Delta({ value, unit = '%', invert = false, size = 'sm' }: { value: number | null; unit?: string; invert?: boolean; size?: 'sm' | 'xs' }) {
  if (value === null || value === undefined) return <span className="text-slate-300 text-xs">—</span>;
  const good = invert ? value < 0 : value > 0;
  const color = value === 0 ? 'text-slate-400' : good ? 'text-emerald-600' : 'text-rose-500';
  const icon = value > 0 ? '↑' : value < 0 ? '↓' : '=';
  const cls = size === 'xs' ? 'text-[10px] font-bold ' : 'text-xs font-bold ';
  return <span className={cls + color}>{icon}{Math.abs(value)}{unit}</span>;
}

function KpiCard({ label, value, delta, deltaUnit, invertDelta, sub }: {
  label: string; value: string; delta?: number | null; deltaUnit?: string; invertDelta?: boolean; sub?: string;
}) {
  return (
    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
      <SectionLabel>{label}</SectionLabel>
      <div className="text-2xl font-black text-slate-800 mt-2">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {delta !== undefined && <Delta value={delta ?? null} unit={deltaUnit ?? '%'} invert={invertDelta} />}
        {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function GSCModule({ onToast }: { onToast: (msg: string) => void }) {
  const { data: session } = useSession();

  const [status, setStatus] = useState<GSCStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [siteUrl, setSiteUrl] = useState('');
  const [presetIdx, setPresetIdx] = useState(0);
  const [customDates, setCustomDates] = useState({
    start: fmt(ago(28)), end: fmt(ago(1)),
    compareStart: fmt(ago(56)), compareEnd: fmt(ago(29)),
  });
  const [useCustom, setUseCustom] = useState(false);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GSCData | null>(null);
  const [error, setError] = useState('');

  const [expandedAI, setExpandedAI] = useState(false);
  const [expandedNearMiss, setExpandedNearMiss] = useState(false);
  const [expandedPages, setExpandedPages] = useState(false);
  const [expandedQueries, setExpandedQueries] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gsc_connected') === '1') {
      onToast('Search Console 연결이 완료됐습니다.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    const errParam = params.get('gsc_error');
    if (errParam) {
      setError('연결 오류: ' + errParam);
      window.history.replaceState({}, '', window.location.pathname);
    }
    fetch('/api/gsc/status')
      .then((r) => r.json())
      .then((d: GSCStatus) => { setStatus(d); setStatusLoading(false); if (d.sites?.length) setSiteUrl(d.sites[0].siteUrl); })
      .catch(() => setStatusLoading(false));
  }, []);

  const activePeriod = useMemo(() => {
    if (useCustom) return customDates;
    const p = PERIOD_PRESETS[presetIdx];
    return { start: p.current.start, end: p.current.end, compareStart: p.compare.start, compareEnd: p.compare.end };
  }, [useCustom, customDates, presetIdx]);

  const handleDisconnect = async () => {
    await fetch('/api/gsc/disconnect', { method: 'POST' });
    setStatus({ connected: false });
    setData(null);
  };

  const fetchData = async () => {
    if (!siteUrl) return;
    setLoading(true); setData(null); setError('');
    try {
      const res = await fetch('/api/gsc/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          startDate: activePeriod.start,
          endDate: activePeriod.end,
          compareStartDate: activePeriod.compareStart,
          compareEndDate: activePeriod.compareEnd,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || `오류 (${res.status})`);
      setData(d);
      onToast('Search Console 데이터를 불러왔습니다.');
    } catch (e) { setError(e instanceof Error ? e.message : '오류'); }
    finally { setLoading(false); }
  };

  // ── Deltas ──
  const pct = (curr: number, prev: number) => prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);
  const deltas = data?.compTotals ? {
    clicks: pct(data.totals.clicks, data.compTotals.clicks),
    impressions: pct(data.totals.impressions, data.compTotals.impressions),
    ctr: data.compTotals.avgCtr > 0
      ? Math.round(((data.totals.avgCtr - data.compTotals.avgCtr) / data.compTotals.avgCtr) * 100)
      : null,
    position: data.compTotals.avgPosition > 0
      ? Math.round((data.compTotals.avgPosition - data.totals.avgPosition) * 10) / 10
      : null, // positive = improved (lower number = better)
  } : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header + Connection ── */}
      <Card className="p-6 md:p-8 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-emerald-200 shadow-lg">
            <Search size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">SEO 인사이트</h3>
            <p className="text-sm text-slate-500">Google Search Console 데이터로 검색 성과를 분석합니다.</p>
          </div>
        </div>

        {/* Connection panel */}
        {statusLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={15} className="animate-spin" /> 연결 상태 확인 중...</div>
        ) : !session?.user ? (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
            Search Console 연동을 위해 먼저 우측 상단에서 Google 로그인을 해주세요.
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            {/* Connected badge */}
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <Link2 size={16} className="text-emerald-600 shrink-0" />
              <span className="text-sm text-emerald-800 flex-1">연결됨: <strong>{status.email}</strong></span>
              <button onClick={handleDisconnect} className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors">
                <Link2Off size={13} /> 연결 해제
              </button>
            </div>

            {/* Site selector */}
            {status.sites && status.sites.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">분석할 사이트</label>
                <select value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)}
                  className="w-full pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm">
                  {status.sites.map((s) => (
                    <option key={s.siteUrl} value={s.siteUrl}>
                      {s.label} {s.isDomain ? '(도메인 속성)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Period presets */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">분석 기간</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PERIOD_PRESETS.map((p, i) => (
                  <button key={i} onClick={() => { setPresetIdx(i); setUseCustom(false); }}
                    className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all ' +
                      (!useCustom && presetIdx === i ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                    {p.label}
                  </button>
                ))}
                <button onClick={() => setUseCustom(true)}
                  className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all ' +
                    (useCustom ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                  커스텀
                </button>
              </div>

              {useCustom && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '기준 시작', key: 'start' }, { label: '기준 종료', key: 'end' },
                    { label: '비교 시작', key: 'compareStart' }, { label: '비교 종료', key: 'compareEnd' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="text-[10px] text-slate-400 block mb-1">{label}</label>
                      <input type="date"
                        value={customDates[key as keyof typeof customDates]}
                        onChange={(e) => setCustomDates((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Active period summary */}
              <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
                <span>📍 기준: {activePeriod.start} ~ {activePeriod.end}</span>
                {activePeriod.compareStart && <span>vs {activePeriod.compareStart} ~ {activePeriod.compareEnd}</span>}
              </div>
            </div>

            <button onClick={fetchData} disabled={loading || !siteUrl}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> 데이터 분석 중...</>
                : <><Zap size={18} /> Search Console 분석 시작</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-800 leading-relaxed">
              Google Search Console을 연결하면 <strong>검색 키워드, 노출수, 클릭률, 게재순위</strong>를 분석하고
              <strong> AI Overview 피해 페이지</strong>를 자동으로 감지합니다.
            </div>
            <a href="/api/gsc/connect"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
              <Link2 size={18} /> Google Search Console 연결
            </a>
          </div>
        )}

        {error && <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>}
      </Card>

      {/* ── Dashboard ── */}
      {data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="총 클릭수" value={fmtNum(data.totals.clicks)}
              delta={deltas?.clicks} deltaUnit="%" sub={deltas ? `vs ${fmtNum(data.compTotals!.clicks)}` : undefined} />
            <KpiCard label="총 노출수" value={fmtNum(data.totals.impressions)}
              delta={deltas?.impressions} deltaUnit="%" sub={deltas ? `vs ${fmtNum(data.compTotals!.impressions)}` : undefined} />
            <KpiCard label="평균 CTR" value={fmtCtr(data.totals.avgCtr)}
              delta={deltas?.ctr} deltaUnit="%" sub={deltas ? `vs ${fmtCtr(data.compTotals!.avgCtr)}` : undefined} />
            <KpiCard label="평균 게재순위" value={fmtPos(data.totals.avgPosition)}
              delta={deltas?.position ?? null} deltaUnit="위" invertDelta
              sub={deltas ? `vs ${fmtPos(data.compTotals!.avgPosition)}위` : undefined} />
          </div>

          {/* ── AI Overview Candidates ── */}
          {data.aiOverviewCandidates.length > 0 && (
            <Card className="border-amber-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 rounded-xl"><AlertTriangle size={18} className="text-amber-600" /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">AI Overview 피해 감지</h4>
                      <p className="text-xs text-slate-500 mt-0.5">순위·노출은 올랐는데 클릭이 줄었습니다 — Google이 답을 직접 제공 중</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-lg">
                    {data.aiOverviewCandidates.length}개 페이지
                  </span>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <Info size={13} className="shrink-0 mt-0.5" />
                  <span>이 페이지들은 경쟁사에게 밀린 것이 아닙니다. 콘텐츠 내용 자체가 AI 답변으로 소비되는 중입니다.
                    <strong> 단순 정보 나열 → 상담 유도형 CTA 강화</strong> 전략으로 전환을 권장합니다.</span>
                </div>

                <div className="mt-4 space-y-2">
                  {(expandedAI ? data.aiOverviewCandidates : data.aiOverviewCandidates.slice(0, 4)).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white border border-amber-100 rounded-xl hover:border-amber-200 transition-colors">
                      <div className="w-6 h-6 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-700 truncate" title={p.page}>{shortPage(p.page)}</div>
                        <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                          <span>노출 {fmtNum(p.impressions)}</span>
                          <span>순위 {fmtPos(p.position)}위</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-rose-600">CTR {fmtCtr(p.ctr)}</div>
                        <Delta value={p.ctrDrop} unit="%" size="xs" />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400">순위 변화</div>
                        <div className="text-xs font-bold text-emerald-600">↑{Math.round(p.prevPosition - p.position)}위</div>
                      </div>
                    </div>
                  ))}
                </div>
                {data.aiOverviewCandidates.length > 4 && (
                  <button onClick={() => setExpandedAI(!expandedAI)}
                    className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                    {expandedAI ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expandedAI ? '접기' : `나머지 ${data.aiOverviewCandidates.length - 4}개 더 보기`}
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* ── Near Miss Keywords ── */}
          {data.nearMissQueries.length > 0 && (
            <Card className="border-indigo-100">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-xl"><Target size={18} className="text-indigo-600" /></div>
                    <div>
                      <h4 className="font-bold text-slate-800">클릭 기회 키워드 <span className="text-sm font-normal text-slate-500">(3~10위 Near Miss)</span></h4>
                      <p className="text-xs text-slate-500 mt-0.5">지금 순위를 조금만 올리면 클릭이 크게 늘어날 키워드입니다</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-2 text-[10px] font-black text-slate-400 uppercase">키워드</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-slate-400 uppercase">현재 순위</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-slate-400 uppercase">노출</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-slate-400 uppercase">현재 클릭</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-indigo-600 uppercase">예상 추가 클릭</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(expandedNearMiss ? data.nearMissQueries : data.nearMissQueries.slice(0, 8)).map((q, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-2 font-medium text-slate-700">{q.query}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={'font-bold text-xs px-2 py-0.5 rounded-lg ' +
                              (q.position <= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                              {fmtPos(q.position)}위
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-600 text-xs">{fmtNum(q.impressions)}</td>
                          <td className="py-2.5 px-2 text-right text-slate-600 text-xs">{q.clicks}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className="text-xs font-black text-indigo-600">+{q.uplift ?? 0}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-400 mt-3">* 예상 추가 클릭 = 순위 3위 달성 시(CTR 10% 기준) 예상 증가분</p>
                {data.nearMissQueries.length > 8 && (
                  <button onClick={() => setExpandedNearMiss(!expandedNearMiss)}
                    className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
                    {expandedNearMiss ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expandedNearMiss ? '접기' : `나머지 ${data.nearMissQueries.length - 8}개 더 보기`}
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* ── CTR Opportunities ── */}
          {data.ctrOpportunities.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-rose-100 rounded-xl"><TrendingDown size={18} className="text-rose-600" /></div>
                  <div>
                    <h4 className="font-bold text-slate-800">CTR 최적화 대상 <span className="text-sm font-normal text-slate-500">(고노출·저클릭)</span></h4>
                    <p className="text-xs text-slate-500 mt-0.5">노출은 많지만 클릭이 적습니다 — 제목·메타 설명 개선으로 즉각 효과</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {data.ctrOpportunities.slice(0, 6).map((q, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm text-slate-700 flex-1">{q.query}</span>
                      <span className="text-xs text-slate-500 shrink-0">{fmtNum(q.impressions)} 노출</span>
                      <span className="text-xs font-bold text-rose-600 shrink-0">CTR {fmtCtr(q.ctr)}</span>
                      <span className="text-xs text-slate-400 shrink-0">{fmtPos(q.position)}위</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ── Top Pages ── */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-xl"><TrendingUp size={18} className="text-emerald-600" /></div>
                  <h4 className="font-bold text-slate-800">페이지별 검색 성과</h4>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['페이지', '클릭', '노출', 'CTR', '순위'].map((h) => (
                        <th key={h} className={'py-2 px-2 text-[10px] font-black text-slate-400 uppercase ' + (h === '페이지' ? 'text-left' : 'text-right')}>{h}</th>
                      ))}
                      <th className="py-2 px-2 text-right text-[10px] font-black text-slate-400 uppercase">링크</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(expandedPages ? data.pages : data.pages.slice(0, 10)).map((p, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-2 font-medium text-slate-700 max-w-[200px] truncate" title={p.page}>{shortPage(p.page)}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-800">{fmtNum(p.clicks)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-500 text-xs">{fmtNum(p.impressions)}</td>
                        <td className="py-2.5 px-2 text-right text-xs">
                          <span className={p.ctr >= 0.05 ? 'text-emerald-600 font-bold' : p.ctr >= 0.02 ? 'text-amber-600' : 'text-rose-500'}>
                            {fmtCtr(p.ctr)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-xs">
                          <span className={'font-bold px-2 py-0.5 rounded-lg ' +
                            (p.position <= 3 ? 'bg-emerald-100 text-emerald-700' : p.position <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                            {fmtPos(p.position)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <a href={p.page} target="_blank" rel="noopener noreferrer"
                            className="text-slate-300 hover:text-emerald-500 transition-colors">
                            <ExternalLink size={13} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.pages.length > 10 && (
                <button onClick={() => setExpandedPages(!expandedPages)}
                  className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600">
                  {expandedPages ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {expandedPages ? '접기' : `전체 ${data.pages.length}개 보기`}
                </button>
              )}
            </div>
          </Card>

          {/* ── Top Queries ── */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-slate-100 rounded-xl"><Search size={18} className="text-slate-600" /></div>
                <h4 className="font-bold text-slate-800">상위 검색 쿼리</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['검색어', '클릭', '노출', 'CTR', '순위'].map((h) => (
                        <th key={h} className={'py-2 px-2 text-[10px] font-black text-slate-400 uppercase ' + (h === '검색어' ? 'text-left' : 'text-right')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(expandedQueries ? data.queries : data.queries.slice(0, 15)).map((q, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-2 text-slate-700">{q.query}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-800">{q.clicks}</td>
                        <td className="py-2.5 px-2 text-right text-slate-500 text-xs">{fmtNum(q.impressions)}</td>
                        <td className="py-2.5 px-2 text-right text-xs">
                          <span className={q.ctr >= 0.05 ? 'text-emerald-600 font-bold' : q.ctr >= 0.02 ? 'text-amber-600' : 'text-rose-500'}>
                            {fmtCtr(q.ctr)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-xs">
                          <span className={'font-bold px-2 py-0.5 rounded-lg ' +
                            (q.position <= 3 ? 'bg-emerald-100 text-emerald-700' : q.position <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                            {fmtPos(q.position)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.queries.length > 15 && (
                <button onClick={() => setExpandedQueries(!expandedQueries)}
                  className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                  {expandedQueries ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {expandedQueries ? '접기' : `전체 ${data.queries.length}개 보기`}
                </button>
              )}
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
