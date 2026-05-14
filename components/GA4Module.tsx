'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  BarChart3, Loader2, CheckCircle2, XCircle, AlertCircle, Zap,
  TrendingUp, TrendingDown, Users, Globe, Monitor, Smartphone, Tablet,
  Eye, Clock, Link2, Link2Off, GitCompare, Wrench, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

// ── Shared UI ──────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

// ── Types ──────────────────────────────────────────────────────────────────
interface CheckResult {
  installed: boolean;
  measurementIds: string[];
  hasGTM: boolean;
  gtmIds: string[];
  gtagScriptFound: boolean;
  hasDataLayer: boolean;
  issues: string[];
}

interface TopPage {
  path: string;
  title: string;
  pageViews: number;
  avgDuration: number;
  bounceRate: number;
  activeUsers: number;
}

interface GA4Data {
  totals: { sessions: number; activeUsers: number; newUsers: number; pageViews: number; avgBounceRate: number; avgSessionDuration: number };
  trend: { date: string; sessions: number; activeUsers: number; newUsers: number; pageViews: number; bounceRate: number }[];
  channels: { channel: string; sessions: number; activeUsers: number; conversions: number }[];
  topPages: TopPage[];
  devices: { device: string; sessions: number; activeUsers: number }[];
}

interface InsightResult {
  healthScore: number;
  executiveSummary: string;
  keyFindings: string[];
  trendDirection: 'growing' | 'declining' | 'stable';
  trendNarrative: string;
  channelInsight: string;
  audienceInsight: string;
  risks: { title: string; severity: 'high' | 'medium' | 'low'; detail: string; action: string }[];
  strengths: { title: string; detail: string }[];
  quickWins: { action: string; detail: string; kpi: string; effort: string }[];
  monthlyGoals: { goal: string; strategy: string; kpi: string }[];
  quarterlyVision: string;
}

interface PeriodTotals {
  sessions: number; activeUsers: number; newUsers: number;
  pageViews: number; avgSessionDuration: number; avgBounceRate: number;
}

interface PeriodData {
  label: string;
  startDate: string;
  endDate: string;
  totals: PeriodTotals;
  channels: { channel: string; sessions: number }[];
  topPages: TopPage[];
}

interface CompareResult {
  periods: PeriodData[];
  deltas: {
    label: string;
    sessions: number | null;
    activeUsers: number | null;
    newUsers: number | null;
    pageViews: number | null;
    avgBounceRate: number;
    avgSessionDuration: number | null;
  }[];
}

interface ScoredPage extends TopPage {
  priority: '긴급' | '주의' | '양호';
  issues: string[];
  problemScore: number;
  rootCause?: string;
  improvements?: string[];
  impact?: string;
  effort?: string;
  expectedResult?: string;
}

interface PageReport {
  pages: { path: string; rootCause: string; improvements: string[]; impact: string; effort: string; expectedResult: string }[];
  summary: string;
}

// ── Period presets ─────────────────────────────────────────────────────────
interface ComparePeriod { start: string; end: string; label: string }

function buildPresets(): { name: string; periods: ComparePeriod[] }[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const ago = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
  const monthStart = (offset: number) => new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const monthEnd = (offset: number) => new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);

  return [
    {
      name: '최근 30일 3기간 비교',
      periods: [
        { start: fmt(ago(29)), end: fmt(today), label: '최근 30일' },
        { start: fmt(ago(59)), end: fmt(ago(30)), label: '이전 30일' },
        { start: fmt(ago(89)), end: fmt(ago(60)), label: '그 이전 30일' },
      ],
    },
    {
      name: '이번달/지난달/전전달',
      periods: [
        { start: fmt(monthStart(0)), end: fmt(today), label: '이번달' },
        { start: fmt(monthStart(-1)), end: fmt(monthEnd(-1)), label: '지난달' },
        { start: fmt(monthStart(-2)), end: fmt(monthEnd(-2)), label: '전전달' },
      ],
    },
    {
      name: '최근 7일 3기간 비교',
      periods: [
        { start: fmt(ago(6)), end: fmt(today), label: '최근 7일' },
        { start: fmt(ago(13)), end: fmt(ago(7)), label: '이전 7일' },
        { start: fmt(ago(20)), end: fmt(ago(14)), label: '그 이전 7일' },
      ],
    },
  ];
}

// ── Scoring ────────────────────────────────────────────────────────────────
function scorePages(pages: TopPage[]): ScoredPage[] {
  if (!pages.length) return [];
  const maxPV = Math.max(...pages.map((p) => p.pageViews), 1);

  return pages
    .map((p) => {
      const tw = p.pageViews / maxPV;
      const issues: string[] = [];

      if (p.bounceRate > 0.7) issues.push(`이탈률 높음 (${Math.round(p.bounceRate * 100)}%)`);
      else if (p.bounceRate > 0.55) issues.push(`이탈률 주의 (${Math.round(p.bounceRate * 100)}%)`);

      if (p.avgDuration < 30) issues.push(`체류시간 매우 짧음 (${Math.round(p.avgDuration)}초)`);
      else if (p.avgDuration < 60) issues.push(`체류시간 짧음 (${Math.round(p.avgDuration)}초)`);

      const bounceScore = Math.max(0, p.bounceRate - 0.4) / 0.6;
      const durScore = Math.max(0, 1 - p.avgDuration / 120);
      const problemScore = (bounceScore * 0.6 + durScore * 0.4) * (0.3 + tw * 0.7);

      let priority: ScoredPage['priority'];
      if (issues.length >= 2 && tw > 0.1) priority = '긴급';
      else if (issues.length > 0) priority = '주의';
      else priority = '양호';

      return { ...p, issues, priority, problemScore };
    })
    .sort((a, b) => {
      const rank = { 긴급: 0, 주의: 1, 양호: 2 };
      return rank[a.priority] - rank[b.priority] || b.problemScore - a.problemScore;
    });
}

// ── Helper formatters ──────────────────────────────────────────────────────
const DEVICE_ICON: Record<string, React.ReactNode> = {
  mobile: <Smartphone size={14} />,
  desktop: <Monitor size={14} />,
  tablet: <Tablet size={14} />,
};

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#6366f1', 'Direct': '#10b981', 'Referral': '#f59e0b',
  'Organic Social': '#ec4899', 'Paid Search': '#8b5cf6', 'Email': '#06b6d4', 'Unassigned': '#94a3b8',
};
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#94a3b8'];

function formatDuration(sec: number) { return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's'; }
function formatNumber(n: number) { return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : n.toLocaleString(); }

function healthColor(score: number) {
  if (score >= 75) return { ring: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: '양호' };
  if (score >= 50) return { ring: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: '보통' };
  return { ring: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', label: '개선 필요' };
}

function DeltaBadge({ value, unit = '%', invert = false }: { value: number | null; unit?: string; invert?: boolean }) {
  if (value === null) return <span className="text-slate-400 text-xs">-</span>;
  const positive = invert ? value < 0 : value > 0;
  const cls = positive ? 'text-emerald-600' : value === 0 ? 'text-slate-400' : 'text-rose-500';
  const icon = value > 0 ? '↑' : value < 0 ? '↓' : '=';
  return (
    <span className={'text-xs font-bold ' + cls}>
      {icon}{Math.abs(value)}{unit}
    </span>
  );
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="p-5">
      <div className={'inline-flex p-2 rounded-xl mb-3 ' + color}><span className="text-white">{icon}</span></div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
      <div className="text-[11px] text-slate-400 font-medium mt-1">{label}</div>
      {sub && <div className="text-[10px] text-slate-300 mt-0.5">{sub}</div>}
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function GA4Module({ onToast }: { onToast: (msg: string) => void }) {
  const { data: session } = useSession();

  // GA4 connection
  const [ga4Status, setGa4Status] = useState<{
    connected: boolean; email?: string;
    properties?: { id: string; displayName: string; account: string }[];
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Install check
  const [siteUrl, setSiteUrl] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  // Analysis mode
  const [analysisMode, setAnalysisMode] = useState<'single' | 'compare'>('single');

  // Single mode
  const [propertyId, setPropertyId] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<InsightResult | null>(null);

  // Compare mode
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [periods, setPeriods] = useState<ComparePeriod[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareData, setCompareData] = useState<CompareResult | null>(null);

  // Page improvement
  const [pageReportLoading, setPageReportLoading] = useState(false);
  const [pageReport, setPageReport] = useState<PageReport | null>(null);
  const [showPageReport, setShowPageReport] = useState(false);

  const [error, setError] = useState('');

  // Build presets once
  const PRESETS = useMemo(() => buildPresets(), []);

  // Init preset periods
  useEffect(() => {
    setPeriods(PRESETS[0].periods);
  }, [PRESETS]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ga4_connected') === '1') {
      onToast('GA4 연결이 완료됐습니다.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    const errParam = params.get('ga4_error');
    if (errParam) {
      setError('GA4 연결 오류: ' + errParam);
      window.history.replaceState({}, '', window.location.pathname);
    }
    fetch('/api/ga4/status')
      .then((r) => r.json())
      .then((d) => { setGa4Status(d); setStatusLoading(false); })
      .catch(() => setStatusLoading(false));
  }, []);

  const handleDisconnect = async () => {
    await fetch('/api/ga4/disconnect', { method: 'POST' });
    setGa4Status({ connected: false });
    setGa4Data(null); setInsight(null); setCompareData(null); setPageReport(null);
  };

  const checkInstall = async () => {
    if (!siteUrl.trim()) return;
    setCheckLoading(true); setCheckResult(null); setError('');
    try {
      const res = await fetch('/api/ga4/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: siteUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `서버 오류 (${res.status})`);
      setCheckResult(data);
      onToast('GA4 설치 확인이 완료됐습니다.');
    } catch (e) { setError(e instanceof Error ? e.message : '오류'); }
    finally { setCheckLoading(false); }
  };

  const fetchGA4Data = async () => {
    if (!propertyId.trim()) return;
    setDataLoading(true); setGa4Data(null); setInsight(null); setPageReport(null); setError('');
    try {
      const res = await fetch('/api/ga4/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `서버 오류 (${res.status})`);
      setGa4Data(data);
      onToast('GA4 데이터를 불러왔습니다.');
      setInsightLoading(true);
      const aRes = await fetch('/api/ga4/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, siteUrl }) });
      const aData = await aRes.json();
      if (aRes.ok) { setInsight(aData); onToast('AI 인사이트 분석이 완료됐습니다.'); }
    } catch (e) { setError(e instanceof Error ? e.message : '오류'); }
    finally { setDataLoading(false); setInsightLoading(false); }
  };

  const fetchCompare = async () => {
    if (!propertyId.trim() || periods.length < 2) return;
    setCompareLoading(true); setCompareData(null); setError('');
    try {
      const res = await fetch('/api/ga4/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId, periods }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `서버 오류 (${res.status})`);
      setCompareData(data);
      onToast('기간 비교 분석이 완료됐습니다.');
    } catch (e) { setError(e instanceof Error ? e.message : '오류'); }
    finally { setCompareLoading(false); }
  };

  const scoredPages = useMemo(() => (ga4Data ? scorePages(ga4Data.topPages) : []), [ga4Data]);
  const problemPages = scoredPages.filter((p) => p.priority !== '양호');

  const fetchPageReport = async () => {
    if (!problemPages.length) return;
    setPageReportLoading(true); setPageReport(null);
    try {
      const res = await fetch('/api/ga4/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          pages: problemPages.map(({ path, title, pageViews, bounceRate, avgDuration, activeUsers, priority, issues }) =>
            ({ path, title, pageViews, bounceRate, avgDuration, activeUsers, priority, issues })
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `서버 오류 (${res.status})`);
      setPageReport(data);
      setShowPageReport(true);
      onToast('페이지 개선안 분석이 완료됐습니다.');
    } catch (e) { setError(e instanceof Error ? e.message : '오류'); }
    finally { setPageReportLoading(false); }
  };

  const hc = insight ? healthColor(insight.healthScore) : null;
  const trendChartData = (ga4Data?.trend ?? []).map((t) => ({
    date: t.date.slice(4, 6) + '/' + t.date.slice(6, 8),
    세션: t.sessions,
    신규사용자: t.newUsers,
  }));
  const totalSessions = ga4Data?.channels.reduce((a, c) => a + c.sessions, 0) ?? 1;

  // ── Comparison table metrics config ──
  const metricRows = [
    { key: 'sessions' as const, label: '세션', fmt: formatNumber, invert: false },
    { key: 'activeUsers' as const, label: '활성 사용자', fmt: formatNumber, invert: false },
    { key: 'newUsers' as const, label: '신규 사용자', fmt: formatNumber, invert: false },
    { key: 'pageViews' as const, label: '페이지뷰', fmt: formatNumber, invert: false },
    { key: 'avgBounceRate' as const, label: '이탈률', fmt: (v: number) => v + '%', invert: true },
    { key: 'avgSessionDuration' as const, label: '세션 시간', fmt: formatDuration, invert: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <Card className="p-6 md:p-8 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-lg"><BarChart3 size={24} /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">GA4 인사이트 분석</h3>
            <p className="text-sm text-slate-500">GA4 설치 확인부터 기간 비교·페이지 개선까지 한 번에.</p>
          </div>
        </div>

        {/* STEP 1 */}
        <div className="space-y-4">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
            GA4 설치 확인
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input type="url" placeholder="https://yoursite.com"
              className="flex-1 pl-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkInstall()} disabled={checkLoading} />
            <button onClick={checkInstall} disabled={checkLoading || !siteUrl.trim()}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap">
              {checkLoading ? <><Loader2 size={16} className="animate-spin" /> 확인 중...</> : '설치 확인'}
            </button>
          </div>
          {checkResult && (
            <div className={'p-4 rounded-2xl border ' + (checkResult.installed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200')}>
              <div className="flex items-center gap-2 mb-3">
                {checkResult.installed ? <CheckCircle2 size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-500" />}
                <span className={'font-bold text-sm ' + (checkResult.installed ? 'text-emerald-800' : 'text-rose-800')}>
                  {checkResult.installed ? 'GA4 설치 확인됨' : 'GA4 미설치'}
                </span>
              </div>
              {checkResult.measurementIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {checkResult.measurementIds.map((id) => <span key={id} className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-black rounded-lg">{id}</span>)}
                  {checkResult.gtmIds.map((id) => <span key={id} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-lg">{id} (GTM)</span>)}
                </div>
              )}
              {checkResult.issues.length > 0 && (
                <ul className="space-y-1">
                  {checkResult.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-rose-700"><AlertCircle size={12} className="shrink-0 mt-0.5" />{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* STEP 2 */}
        <div className="mt-6 space-y-4">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
            GA4 데이터 연동 · 분석
          </div>

          {statusLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><Loader2 size={15} className="animate-spin" /> 연결 상태 확인 중...</div>
          ) : !session?.user ? (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">GA4 데이터 연동을 위해 먼저 우측 상단에서 Google 로그인을 해주세요.</div>
          ) : ga4Status?.connected ? (
            <>
              {/* Connected header */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <Link2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-800 flex-1">연결됨: <strong>{ga4Status.email}</strong></span>
                <button onClick={handleDisconnect} className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors">
                  <Link2Off size={13} /> 연결 해제
                </button>
              </div>

              {/* Property selector */}
              {ga4Status.properties && ga4Status.properties.length > 0 ? (
                <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={dataLoading || compareLoading}
                  className="w-full pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm">
                  <option value="">속성 선택...</option>
                  {ga4Status.properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName} — {p.account} (ID: {p.id})</option>
                  ))}
                </select>
              ) : (
                <input type="text" placeholder="GA4 Property ID (예: 123456789)"
                  className="w-full pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={dataLoading || compareLoading} />
              )}

              {/* Mode tabs */}
              <div className="flex gap-2">
                {(['single', 'compare'] as const).map((m) => (
                  <button key={m} onClick={() => setAnalysisMode(m)}
                    className={'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ' +
                      (analysisMode === m ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                    {m === 'single' ? <><BarChart3 size={14} /> 단일 분석</> : <><GitCompare size={14} /> 기간 비교</>}
                  </button>
                ))}
              </div>

              {/* Single mode */}
              {analysisMode === 'single' && (
                <button onClick={fetchGA4Data} disabled={dataLoading || !propertyId.trim()}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                  {dataLoading ? <><Loader2 size={18} className="animate-spin" /> 데이터 수집 중...</> : <><Zap size={18} /> GA4 데이터 불러오기 + AI 분석</>}
                </button>
              )}

              {/* Compare mode */}
              {analysisMode === 'compare' && (
                <div className="space-y-4">
                  {/* Presets */}
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p, i) => (
                      <button key={i} onClick={() => { setSelectedPreset(i); setPeriods(PRESETS[i].periods); }}
                        className={'px-3 py-1.5 rounded-lg text-xs font-bold transition-all ' +
                          (selectedPreset === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                        {p.name}
                      </button>
                    ))}
                  </div>

                  {/* Period date inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {periods.map((p, i) => (
                      <div key={i} className={'p-3 rounded-xl border ' + (i === 0 ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-slate-50')}>
                        <div className={'text-[10px] font-black uppercase tracking-wide mb-2 ' + (i === 0 ? 'text-indigo-600' : 'text-slate-500')}>
                          {i === 0 ? '기준 기간' : `비교 기간 ${i}`}
                        </div>
                        <div className="text-xs font-bold text-slate-700 mb-1">{p.label}</div>
                        <input type="date" value={p.start} onChange={(e) => { const next = [...periods]; next[i] = { ...next[i], start: e.target.value }; setPeriods(next); }}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white mb-1 outline-none focus:ring-1 focus:ring-indigo-400" />
                        <input type="date" value={p.end} onChange={(e) => { const next = [...periods]; next[i] = { ...next[i], end: e.target.value }; setPeriods(next); }}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-400" />
                      </div>
                    ))}
                  </div>

                  <button onClick={fetchCompare} disabled={compareLoading || !propertyId.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                    {compareLoading ? <><Loader2 size={18} className="animate-spin" /> 비교 분석 중...</> : <><GitCompare size={18} /> 3기간 비교 분석 실행</>}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
                Google 계정으로 연결하면 서비스 계정 없이 GA4 데이터를 바로 분석할 수 있습니다.
              </div>
              <a href="/api/ga4/connect"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                <Link2 size={18} /> Google Analytics 연결
              </a>
            </>
          )}

          {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>}
        </div>
      </Card>

      {/* ── Compare dashboard ── */}
      {compareData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><GitCompare size={18} className="text-indigo-600" /> 기간별 핵심 지표 비교</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-black text-slate-400 uppercase">지표</th>
                    {compareData.periods.map((p, i) => (
                      <th key={i} className={'text-right py-2 px-3 text-xs font-black ' + (i === 0 ? 'text-indigo-600' : 'text-slate-500')}>
                        {p.label}<div className="text-[9px] font-normal">{p.startDate} ~ {p.endDate}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricRows.map(({ key, label, fmt, invert }) => (
                    <tr key={key} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-xs font-bold text-slate-600">{label}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-800">{fmt(compareData.periods[0].totals[key])}</td>
                      {compareData.periods.slice(1).map((p, i) => (
                        <td key={i} className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-700">{fmt(p.totals[key])}</div>
                          <DeltaBadge
                            value={key === 'avgBounceRate' ? compareData.deltas[i].avgBounceRate : compareData.deltas[i][key as keyof typeof compareData.deltas[0]] as number | null}
                            unit={key === 'avgBounceRate' ? 'pp' : '%'}
                            invert={invert}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">* 화살표 방향은 기준 기간 기준. 이탈률은 pp(퍼센트포인트) 차이.</p>
          </Card>

          {/* Channel comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {compareData.periods.map((p, pi) => (
              <Card key={pi} className={'p-5 ' + (pi === 0 ? 'border-indigo-200' : '')}>
                <div className={'text-[10px] font-black uppercase tracking-wide mb-3 ' + (pi === 0 ? 'text-indigo-600' : 'text-slate-400')}>
                  {pi === 0 ? '📍 기준: ' : ''}{p.label}
                </div>
                <div className="space-y-2">
                  {p.channels.slice(0, 5).map((c) => {
                    const total = p.channels.reduce((a, x) => a + x.sessions, 0) || 1;
                    return (
                      <div key={c.channel} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHANNEL_COLORS[c.channel] ?? '#94a3b8' }} />
                        <span className="text-xs text-slate-600 flex-1 truncate">{c.channel}</span>
                        <span className="text-xs font-bold text-slate-800">{Math.round((c.sessions / total) * 100)}%</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          {/* Top page rank comparison */}
          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2"><Eye size={16} className="text-indigo-600" /> 상위 페이지 기간 비교 (PV 기준)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-2 text-slate-400 font-black">#</th>
                    <th className="text-left py-2 px-2 text-slate-400 font-black">페이지</th>
                    {compareData.periods.map((p, i) => (
                      <th key={i} className={'text-right py-2 px-2 font-black ' + (i === 0 ? 'text-indigo-600' : 'text-slate-400')}>{p.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareData.periods[0].topPages.slice(0, 8).map((page, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-2 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2 px-2 text-slate-700 max-w-[180px] truncate" title={page.path}>{page.path}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-800">{formatNumber(page.pageViews)}</td>
                      {compareData.periods.slice(1).map((p, pi) => {
                        const match = p.topPages.find((x) => x.path === page.path);
                        if (!match) return <td key={pi} className="py-2 px-2 text-right text-slate-300">—</td>;
                        const delta = pctDeltaFn(page.pageViews, match.pageViews);
                        return (
                          <td key={pi} className="py-2 px-2 text-right">
                            <div className="text-slate-700">{formatNumber(match.pageViews)}</div>
                            <DeltaBadge value={delta} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Single mode dashboard ── */}
      {ga4Data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="총 세션" value={formatNumber(ga4Data.totals.sessions)} icon={<Globe size={16} />} color="bg-indigo-600" />
            <StatCard label="활성 사용자" value={formatNumber(ga4Data.totals.activeUsers)} sub={'신규 ' + formatNumber(ga4Data.totals.newUsers)} icon={<Users size={16} />} color="bg-emerald-500" />
            <StatCard label="평균 이탈률" value={ga4Data.totals.avgBounceRate + '%'} icon={<TrendingDown size={16} />} color={ga4Data.totals.avgBounceRate > 60 ? 'bg-rose-500' : 'bg-amber-500'} />
            <StatCard label="평균 세션 시간" value={formatDuration(ga4Data.totals.avgSessionDuration)} icon={<Clock size={16} />} color="bg-purple-500" />
          </div>

          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600" /> 최근 30일 세션 추이</h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="gSession" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="세션" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#gSession)" />
                  <Area type="monotone" dataKey="신규사용자" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={18} className="text-indigo-600" /> 채널별 트래픽</h4>
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ga4Data.channels} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="channel" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="sessions" name="세션" radius={[0, 4, 4, 0]}>
                      {ga4Data.channels.map((c, i) => <Cell key={i} fill={CHANNEL_COLORS[c.channel] ?? PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {ga4Data.channels.slice(0, 4).map((c) => (
                  <div key={c.channel} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHANNEL_COLORS[c.channel] ?? '#94a3b8' }} />
                    <span className="text-xs text-slate-600 flex-1">{c.channel}</span>
                    <span className="text-xs font-bold text-slate-800">{Math.round((c.sessions / totalSessions) * 100)}%</span>
                    {c.conversions > 0 && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-lg">{c.conversions} 전환</span>}
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2"><Monitor size={16} className="text-indigo-600" /> 기기별</h4>
                <div className="flex gap-3">
                  {ga4Data.devices.map((d) => {
                    const pct = Math.round((d.sessions / ga4Data.totals.sessions) * 100);
                    return (
                      <div key={d.device} className="flex-1 text-center p-3 bg-slate-50 rounded-xl">
                        <div className="flex justify-center mb-1 text-indigo-500">{DEVICE_ICON[d.device] ?? <Monitor size={14} />}</div>
                        <div className="text-lg font-black text-slate-800">{pct}%</div>
                        <div className="text-[10px] text-slate-400 capitalize">{d.device}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2"><Eye size={16} className="text-indigo-600" /> 상위 페이지</h4>
                <div className="space-y-2">
                  {ga4Data.topPages.slice(0, 4).map((p, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-[10px] font-black text-slate-400 w-4">{i + 1}</span>
                      <span className="text-xs text-slate-700 flex-1 truncate" title={p.path}>{p.path}</span>
                      <span className="text-xs font-bold text-slate-800 shrink-0">{formatNumber(p.pageViews)}</span>
                      <span className={'text-[10px] font-bold shrink-0 ' + (p.bounceRate > 0.7 ? 'text-rose-500' : p.bounceRate > 0.5 ? 'text-amber-500' : 'text-emerald-600')}>
                        {Math.round(p.bounceRate * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* ── Page Improvement Section ── */}
          {scoredPages.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Wrench size={18} className="text-amber-500" /> 페이지 개선 진단
                  {problemPages.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-black rounded-full">
                      {problemPages.filter(p => p.priority === '긴급').length}긴급 {problemPages.filter(p => p.priority === '주의').length}주의
                    </span>
                  )}
                </h4>
                {problemPages.length > 0 && !pageReport && (
                  <button onClick={fetchPageReport} disabled={pageReportLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all">
                    {pageReportLoading ? <><Loader2 size={13} className="animate-spin" /> 분석 중...</> : <><Zap size={13} /> AI 개선안 분석</>}
                  </button>
                )}
                {pageReport && (
                  <button onClick={() => setShowPageReport(!showPageReport)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
                    {showPageReport ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showPageReport ? '접기' : '개선안 보기'}
                  </button>
                )}
              </div>

              {/* Scored page list */}
              <div className="space-y-2 mb-4">
                {scoredPages.map((p, i) => {
                  const report = pageReport?.pages.find((r) => r.path === p.path);
                  return (
                    <div key={i} className={'rounded-xl border p-4 ' +
                      (p.priority === '긴급' ? 'border-rose-200 bg-rose-50' : p.priority === '주의' ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-white')}>
                      <div className="flex items-start gap-3">
                        <span className={'text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ' +
                          (p.priority === '긴급' ? 'bg-rose-500 text-white' : p.priority === '주의' ? 'bg-amber-400 text-white' : 'bg-emerald-100 text-emerald-700')}>
                          {p.priority}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate" title={p.path}>{p.path}</div>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                            <span>PV {formatNumber(p.pageViews)}</span>
                            <span className={p.bounceRate > 0.7 ? 'text-rose-600 font-bold' : p.bounceRate > 0.55 ? 'text-amber-600 font-bold' : ''}>
                              이탈률 {Math.round(p.bounceRate * 100)}%
                            </span>
                            <span className={p.avgDuration < 30 ? 'text-rose-600 font-bold' : p.avgDuration < 60 ? 'text-amber-600 font-bold' : ''}>
                              체류 {formatDuration(Math.round(p.avgDuration))}
                            </span>
                          </div>
                          {p.issues.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {p.issues.map((issue, ii) => (
                                <span key={ii} className={'text-[10px] font-bold px-2 py-0.5 rounded-lg ' +
                                  (p.priority === '긴급' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>
                                  {issue}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* AI report for this page */}
                          {report && showPageReport && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                              <div className="text-xs font-black text-slate-500 uppercase tracking-wide">AI 진단 결과</div>
                              <p className="text-xs text-slate-700 leading-relaxed"><strong>원인:</strong> {report.rootCause}</p>
                              <ul className="space-y-1">
                                {report.improvements.map((imp, ii) => (
                                  <li key={ii} className="flex items-start gap-1.5 text-xs text-slate-700">
                                    <span className="text-indigo-500 shrink-0 mt-0.5">•</span>{imp}
                                  </li>
                                ))}
                              </ul>
                              <div className="flex gap-3 pt-1">
                                <span className={'text-[10px] font-bold px-2 py-0.5 rounded-lg ' + (report.impact === '높음' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600')}>
                                  영향도 {report.impact}
                                </span>
                                <span className={'text-[10px] font-bold px-2 py-0.5 rounded-lg ' + (report.effort === '낮음' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                                  난이도 {report.effort}
                                </span>
                              </div>
                              {report.expectedResult && (
                                <p className="text-[10px] text-emerald-700 font-bold">💡 {report.expectedResult}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {pageReport?.summary && showPageReport && (
                <div className="p-4 bg-indigo-950 text-white rounded-2xl text-sm leading-relaxed">
                  <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">종합 개선 의견</div>
                  {pageReport.summary}
                </div>
              )}
            </Card>
          )}

          {/* ── AI Insights ── */}
          {(insightLoading || insight) && (
            <div className="space-y-5">
              {insightLoading && !insight ? (
                <Card className="p-10 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">AI가 30일 데이터를 분석하고 있습니다...</span>
                  <span className="text-xs text-slate-400">주차별 추이, 채널 리스크, 개선안을 도출 중</span>
                </Card>
              ) : insight && <InsightReport insight={insight} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// helper needed inside JSX
function pctDeltaFn(base: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((base - prev) / prev) * 100);
}

// ── Insight Report Component ───────────────────────────────────────────────
function InsightReport({ insight }: { insight: InsightResult }) {
  const hc = healthColor(insight.healthScore);

  const trendBadge = {
    growing: { label: '성장 중 ↑', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    declining: { label: '하락 중 ↓', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
    stable: { label: '보합 →', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  }[insight.trendDirection ?? 'stable'];

  const severityConfig = {
    high: { label: '높음', cls: 'bg-rose-500 text-white' },
    medium: { label: '중간', cls: 'bg-amber-400 text-white' },
    low: { label: '낮음', cls: 'bg-slate-300 text-slate-700' },
  };

  return (
    <>
      {/* ── Executive Summary ── */}
      <div className="rounded-2xl bg-indigo-950 text-white p-6 md:p-8">
        <div className="flex items-start gap-6">
          {/* Health score */}
          <div className="shrink-0 flex flex-col items-center">
            <div className={'w-20 h-20 rounded-full border-4 flex items-center justify-center ' + hc.ring + ' ' + hc.bg}>
              <span className={'text-2xl font-black ' + hc.text}>{insight.healthScore}</span>
            </div>
            <span className={'text-[10px] font-black mt-1.5 ' + hc.text}>{hc.label}</span>
            <span className="text-[10px] text-indigo-400 mt-0.5">마케팅 건강도</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-indigo-400" fill="currentColor" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Executive Summary</span>
              <span className={'text-[10px] font-black px-2 py-0.5 rounded-full border ' + trendBadge.cls}>{trendBadge.label}</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{insight.executiveSummary}</p>
          </div>
        </div>

        {/* Key Findings */}
        {insight.keyFindings?.length > 0 && (
          <div className="mt-6 pt-5 border-t border-indigo-800">
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">핵심 발견 사항</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {insight.keyFindings.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                  <span className="w-4 h-4 bg-indigo-700 text-indigo-200 rounded flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">{i + 1}</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Trend · Channel · Audience ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <TrendingUp size={12} /> 트렌드 분석
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.trendNarrative}</p>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Globe size={12} /> 채널 인사이트
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.channelInsight}</p>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Users size={12} /> 오디언스 분석
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.audienceInsight}</p>
        </Card>
      </div>

      {/* ── Strengths & Risks ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} className="text-emerald-500" /> 현재 잘 되고 있는 것
          </h4>
          <div className="space-y-3">
            {(insight.strengths ?? []).map((s, i) => (
              <div key={i} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-sm font-bold text-emerald-800 mb-1">{s.title ?? s}</div>
                {typeof s === 'object' && s.detail && (
                  <p className="text-xs text-emerald-700 leading-relaxed">{s.detail}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Risks */}
        <Card className="p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
            <AlertCircle size={16} className="text-rose-500" /> 위험 신호 및 대응
          </h4>
          <div className="space-y-3">
            {(insight.risks ?? []).map((r, i) => {
              const sc = severityConfig[r.severity] ?? severityConfig.medium;
              return (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={'text-[9px] font-black px-1.5 py-0.5 rounded ' + sc.cls}>{sc.label}</span>
                    <span className="text-sm font-bold text-slate-800">{typeof r === 'object' ? r.title : r}</span>
                  </div>
                  {typeof r === 'object' && (
                    <>
                      <p className="text-xs text-slate-600 leading-relaxed mb-1.5">{r.detail}</p>
                      <div className="flex items-start gap-1 text-[11px] text-indigo-700 font-medium">
                        <Zap size={10} className="shrink-0 mt-0.5" fill="currentColor" />
                        {r.action}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Quick Wins ── */}
      <Card className="p-6">
        <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Zap size={18} className="text-amber-500" fill="currentColor" /> 이번 주 Quick Win
        </h4>
        <p className="text-xs text-slate-400 mb-4">지금 바로 실행 가능한 고효율 액션</p>
        <div className="space-y-3">
          {(insight.quickWins ?? []).map((w, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="w-7 h-7 bg-amber-500 text-white rounded-xl flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 mb-1">{typeof w === 'object' ? w.action : w}</p>
                {typeof w === 'object' && (
                  <>
                    {w.detail && <p className="text-xs text-slate-600 mb-1.5">{w.detail}</p>}
                    {w.kpi && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                        <TrendingUp size={10} /> 예상 효과: {w.kpi}
                      </div>
                    )}
                  </>
                )}
              </div>
              <span className={'text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ' +
                ((typeof w === 'object' ? w.effort : '') === '낮음' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                {typeof w === 'object' ? w.effort : ''}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Monthly Goals ── */}
      <Card className="p-6">
        <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-500" /> 이번 달 목표 및 전략
        </h4>
        <p className="text-xs text-slate-400 mb-4">수치 기반 목표와 실행 로드맵</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(insight.monthlyGoals ?? []).map((g, i) => (
            <div key={i} className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black mb-3">{i + 1}</div>
              <p className="text-sm font-bold text-slate-800 mb-2">{typeof g === 'object' ? g.goal : g}</p>
              {typeof g === 'object' && (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{g.strategy}</p>
                  {g.kpi && (
                    <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1">
                      📊 {g.kpi}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ── Quarterly Vision ── */}
      {insight.quarterlyVision && (
        <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-indigo-600 rounded-xl shrink-0">
            <TrendingUp size={16} />
          </div>
          <div>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">3개월 비전</div>
            <p className="text-sm text-slate-300 leading-relaxed">{insight.quarterlyVision}</p>
          </div>
        </div>
      )}
    </>
  );
}
