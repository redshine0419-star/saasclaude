'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  BarChart3, Loader2, CheckCircle2, XCircle, AlertCircle, Zap,
  TrendingUp, TrendingDown, Users, Globe, Monitor, Smartphone, Tablet,
  Eye, Clock, Link2, Link2Off, Wrench, ChevronDown, ChevronUp,
  Search, AlertTriangle, Target, ExternalLink, Info, GitMerge,
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

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{children}</div>
);

// ── Types ──────────────────────────────────────────────────────────────────
interface GA4Status {
  connected: boolean;
  email?: string;
  properties?: { id: string; displayName: string; account: string }[];
}

interface GSCStatus {
  connected: boolean;
  email?: string;
  sites?: { siteUrl: string; label: string; isDomain: boolean }[];
}

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

interface GSCPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  potentialClicks?: number;
  uplift?: number;
}

interface GSCTotals {
  clicks: number;
  impressions: number;
  avgCtr: number;
  avgPosition: number;
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

interface GSCData {
  period: { startDate: string; endDate: string };
  comparePeriod: { startDate: string; endDate: string } | null;
  totals: GSCTotals;
  compTotals: GSCTotals | null;
  pages: GSCPage[];
  queries: GSCQuery[];
  aiOverviewCandidates: AIOverviewCandidate[];
  nearMissQueries: GSCQuery[];
  ctrOpportunities: GSCQuery[];
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

interface ScoredPage extends TopPage {
  priority: '긴급' | '주의' | '양호';
  issues: string[];
  problemScore: number;
}

interface PageReport {
  pages: { path: string; rootCause: string; improvements: string[]; impact: string; effort: string; expectedResult: string }[];
  summary: string;
}

interface CrossPage extends TopPage {
  gsc: GSCPage | null;
  diagnosis: '랜딩 개선 필요' | '제목 최적화' | '콘텐츠 개선' | '양호';
}

// ── Date helpers (GSC) ─────────────────────────────────────────────────────
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

// ── Formatters ─────────────────────────────────────────────────────────────
function formatDuration(sec: number) { return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's'; }
function formatNumber(n: number) { return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : n.toLocaleString(); }
const fmtCtr = (n: number) => (n * 100).toFixed(1) + '%';
const fmtPos = (n: number) => n.toFixed(1);
const shortPage = (url: string) => { try { return new URL(url).pathname || '/'; } catch { return url; } };

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

function healthColor(score: number) {
  if (score >= 75) return { ring: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: '양호' };
  if (score >= 50) return { ring: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: '보통' };
  return { ring: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', label: '개선 필요' };
}

// ── scorePages ─────────────────────────────────────────────────────────────
function scorePages(pages: TopPage[]): ScoredPage[] {
  if (!pages.length) return [];
  const maxPV = Math.max(...pages.map((p) => p.pageViews), 1);
  return pages.map((p) => {
    const tw = p.pageViews / maxPV;
    const issues: string[] = [];
    if (p.bounceRate > 0.7) issues.push(`이탈률 높음 (${Math.round(p.bounceRate * 100)}%)`);
    else if (p.bounceRate > 0.55) issues.push(`이탈률 주의 (${Math.round(p.bounceRate * 100)}%)`);
    if (p.avgDuration < 30) issues.push(`체류시간 매우 짧음 (${Math.round(p.avgDuration)}초)`);
    else if (p.avgDuration < 60) issues.push(`체류시간 짧음 (${Math.round(p.avgDuration)}초)`);
    const bounceScore = Math.max(0, p.bounceRate - 0.4) / 0.6;
    const durScore = Math.max(0, 1 - p.avgDuration / 120);
    const problemScore = (bounceScore * 0.6 + durScore * 0.4) * (0.3 + tw * 0.7);
    let priority: '긴급' | '주의' | '양호';
    if (issues.length >= 2 && tw > 0.1) priority = '긴급';
    else if (issues.length > 0) priority = '주의';
    else priority = '양호';
    return { ...p, issues, priority, problemScore };
  }).sort((a, b) => {
    const rank = { 긴급: 0, 주의: 1, 양호: 2 };
    return rank[a.priority] - rank[b.priority] || b.problemScore - a.problemScore;
  });
}

// ── mergePages ─────────────────────────────────────────────────────────────
function mergePages(ga4Pages: TopPage[], gscPages: GSCPage[]): CrossPage[] {
  const gscMap = new Map<string, GSCPage>();
  for (const p of gscPages) {
    try { gscMap.set(new URL(p.page).pathname, p); }
    catch { gscMap.set(p.page, p); }
  }
  return ga4Pages.map((ga4) => {
    const gsc = gscMap.get(ga4.path) ?? null;
    let diagnosis: CrossPage['diagnosis'];
    if (gsc && gsc.ctr > 0.03 && ga4.bounceRate > 0.7) diagnosis = '랜딩 개선 필요';
    else if (gsc && gsc.impressions > 100 && gsc.ctr < 0.02) diagnosis = '제목 최적화';
    else if (ga4.bounceRate > 0.65 && ga4.avgDuration < 60) diagnosis = '콘텐츠 개선';
    else diagnosis = '양호';
    return { ...ga4, gsc, diagnosis };
  });
}

// ── Delta badge ────────────────────────────────────────────────────────────
function DeltaBadge({ value, unit = '%', invert = false }: { value: number | null; unit?: string; invert?: boolean }) {
  if (value === null || value === undefined) return <span className="text-slate-300 text-xs">—</span>;
  const positive = invert ? value < 0 : value > 0;
  const cls = positive ? 'text-emerald-600' : value === 0 ? 'text-slate-400' : 'text-rose-500';
  const icon = value > 0 ? '↑' : value < 0 ? '↓' : '=';
  return <span className={'text-xs font-bold ' + cls}>{icon}{Math.abs(value)}{unit}</span>;
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MarketingInsightModule({ onToast }: { onToast: (msg: string) => void }) {
  const { data: session } = useSession();

  // ── Connection states ──
  const [ga4Status, setGa4Status] = useState<GA4Status | null>(null);
  const [gscStatus, setGscStatus] = useState<GSCStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // ── Settings ──
  const [propertyId, setPropertyId] = useState('');
  const [gscSiteUrl, setGscSiteUrl] = useState('');
  const [presetIdx, setPresetIdx] = useState(0);
  const [useCustom, setUseCustom] = useState(false);
  const [customDates, setCustomDates] = useState({
    start: fmt(ago(28)), end: fmt(ago(1)),
    compareStart: fmt(ago(56)), compareEnd: fmt(ago(29)),
  });

  // ── Install check ──
  const [installUrl, setInstallUrl] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  // ── Data ──
  const [loading, setLoading] = useState(false);
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);
  const [gscData, setGscData] = useState<GSCData | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [error, setError] = useState('');

  // ── Page improvement ──
  const [pageReportLoading, setPageReportLoading] = useState(false);
  const [pageReport, setPageReport] = useState<PageReport | null>(null);
  const [showPageReport, setShowPageReport] = useState(false);

  // ── UI expansion ──
  const [expandedAI, setExpandedAI] = useState(false);
  const [expandedNearMiss, setExpandedNearMiss] = useState(false);
  const [expandedPages, setExpandedPages] = useState(false);
  const [expandedCross, setExpandedCross] = useState(false);

  // ── Load statuses in parallel on mount ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ga4_connected') === '1') { onToast('GA4 연결이 완료됐습니다.'); window.history.replaceState({}, '', window.location.pathname); }
    if (params.get('gsc_connected') === '1') { onToast('Search Console 연결이 완료됐습니다.'); window.history.replaceState({}, '', window.location.pathname); }
    const errParam = params.get('ga4_error') || params.get('gsc_error');
    if (errParam) { setError('연결 오류: ' + errParam); window.history.replaceState({}, '', window.location.pathname); }

    Promise.allSettled([
      fetch('/api/ga4/status').then((r) => r.json()),
      fetch('/api/gsc/status').then((r) => r.json()),
    ]).then(([ga4Res, gscRes]) => {
      if (ga4Res.status === 'fulfilled') setGa4Status(ga4Res.value);
      if (gscRes.status === 'fulfilled') {
        const d = gscRes.value as GSCStatus;
        setGscStatus(d);
        if (d.sites?.length) setGscSiteUrl(d.sites[0].siteUrl);
      }
      setStatusLoading(false);
    });
  }, []);

  const ga4Connected = ga4Status?.connected ?? false;
  const gscConnected = gscStatus?.connected ?? false;
  const anyConnected = ga4Connected || gscConnected;
  const bothConnected = ga4Connected && gscConnected;

  const activePeriod = useMemo(() => {
    if (useCustom) return customDates;
    const p = PERIOD_PRESETS[presetIdx];
    return { start: p.current.start, end: p.current.end, compareStart: p.compare.start, compareEnd: p.compare.end };
  }, [useCustom, customDates, presetIdx]);

  // ── Disconnect handlers ──
  const handleGa4Disconnect = async () => {
    await fetch('/api/ga4/disconnect', { method: 'POST' });
    setGa4Status({ connected: false });
    setGa4Data(null); setInsight(null); setPageReport(null);
  };

  const handleGscDisconnect = async () => {
    await fetch('/api/gsc/disconnect', { method: 'POST' });
    setGscStatus({ connected: false });
    setGscData(null);
  };

  // ── Install check ──
  const checkInstall = async () => {
    if (!installUrl.trim()) return;
    setCheckLoading(true); setCheckResult(null);
    try {
      const res = await fetch('/api/ga4/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: installUrl }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `서버 오류 (${res.status})`);
      setCheckResult(data);
      onToast('GA4 설치 확인이 완료됐습니다.');
    } catch (e) { setError(e instanceof Error ? e.message : '오류'); }
    finally { setCheckLoading(false); }
  };

  // ── Fetch both GA4 + GSC in parallel ──
  const fetchAll = async () => {
    setLoading(true); setGa4Data(null); setGscData(null); setInsight(null); setError(''); setPageReport(null);
    try {
      const [ga4Res, gscRes] = await Promise.allSettled([
        ga4Connected && propertyId
          ? fetch('/api/ga4/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId }) }).then((r) => r.json())
          : Promise.resolve(null),
        gscConnected && gscSiteUrl
          ? fetch('/api/gsc/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteUrl: gscSiteUrl, startDate: activePeriod.start, endDate: activePeriod.end, compareStartDate: activePeriod.compareStart, compareEndDate: activePeriod.compareEnd }) }).then((r) => r.json())
          : Promise.resolve(null),
      ]);

      const ga4D = ga4Res.status === 'fulfilled' ? ga4Res.value : null;
      const gscD = gscRes.status === 'fulfilled' ? gscRes.value : null;

      if (ga4D && !ga4D.error) { setGa4Data(ga4D); onToast('GA4 데이터를 불러왔습니다.'); }
      else if (ga4Connected && propertyId && ga4D?.error) setError('GA4: ' + ga4D.error);

      if (gscD && !gscD.error) { setGscData(gscD); onToast('Search Console 데이터를 불러왔습니다.'); }
      else if (gscConnected && gscSiteUrl && gscD?.error) setError((prev) => prev ? prev + ' | GSC: ' + gscD.error : 'GSC: ' + gscD.error);

      // AI insight (only if GA4 loaded)
      if (ga4D && !ga4D.error) {
        setInsightLoading(true);
        try {
          const aRes = await fetch('/api/ga4/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: ga4D, siteUrl: gscSiteUrl, gscData: gscD && !gscD.error ? gscD : undefined }),
          });
          const aData = await aRes.json();
          if (aRes.ok) { setInsight(aData); onToast('AI 인사이트 분석이 완료됐습니다.'); }
        } catch { /* insight is optional */ }
        finally { setInsightLoading(false); }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ── Page improvement ──
  const scoredPages = useMemo(() => (ga4Data ? scorePages(ga4Data.topPages) : []), [ga4Data]);
  const problemPages = scoredPages.filter((p) => p.priority !== '양호');

  const fetchPageReport = async () => {
    if (!problemPages.length) return;
    setPageReportLoading(true); setPageReport(null);
    try {
      const derivedSiteUrl = gscSiteUrl || installUrl || '';
      const res = await fetch('/api/ga4/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: derivedSiteUrl,
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

  // ── Derived ──
  const trendChartData = (ga4Data?.trend ?? []).map((t) => ({
    date: t.date.slice(4, 6) + '/' + t.date.slice(6, 8),
    세션: t.sessions,
    신규사용자: t.newUsers,
  }));
  const totalSessions = ga4Data?.channels.reduce((a, c) => a + c.sessions, 0) ?? 1;

  const gscDeltas = gscData?.compTotals ? {
    clicks: pct(gscData.totals.clicks, gscData.compTotals.clicks),
    impressions: pct(gscData.totals.impressions, gscData.compTotals.impressions),
    ctr: gscData.compTotals.avgCtr > 0 ? Math.round(((gscData.totals.avgCtr - gscData.compTotals.avgCtr) / gscData.compTotals.avgCtr) * 100) : null,
    position: gscData.compTotals.avgPosition > 0 ? Math.round((gscData.compTotals.avgPosition - gscData.totals.avgPosition) * 10) / 10 : null,
  } : null;

  const crossPages = useMemo(() => {
    if (!ga4Data || !gscData) return [];
    return mergePages(ga4Data.topPages, gscData.pages).slice(0, 10);
  }, [ga4Data, gscData]);

  const canFetch = (ga4Connected && propertyId) || (gscConnected && gscSiteUrl);

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <Card className="p-6 md:p-8 border-slate-200 bg-gradient-to-br from-white to-slate-50/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-emerald-600 text-white rounded-xl shadow-lg">
            <GitMerge size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">통합 마케팅 인사이트</h3>
            <p className="text-sm text-slate-500">GA4 분석 + Search Console을 하나의 화면에서 교차 분석합니다.</p>
          </div>
        </div>

        {/* ── Two-column connection cards ── */}
        {statusLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-2"><Loader2 size={15} className="animate-spin" /> 연결 상태 확인 중...</div>
        ) : !session?.user ? (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">연동을 위해 먼저 우측 상단에서 Google 로그인을 해주세요.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* GA4 card */}
            <div className={'rounded-2xl border p-5 ' + (ga4Connected ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white')}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-indigo-100 rounded-xl"><BarChart3 size={16} className="text-indigo-600" /></div>
                <span className="font-bold text-slate-800 text-sm">Google Analytics 4</span>
                {ga4Connected && (
                  <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full">연결됨</span>
                )}
              </div>
              {ga4Connected ? (
                <div className="flex items-center gap-2">
                  <Link2 size={13} className="text-indigo-500 shrink-0" />
                  <span className="text-xs text-indigo-800 flex-1 truncate">{ga4Status?.email}</span>
                  <button onClick={handleGa4Disconnect} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors shrink-0">
                    <Link2Off size={12} /> 해제
                  </button>
                </div>
              ) : (
                <a href="/api/ga4/connect"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all">
                  <Link2 size={14} /> GA4 연결
                </a>
              )}
            </div>

            {/* GSC card */}
            <div className={'rounded-2xl border p-5 ' + (gscConnected ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white')}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-emerald-100 rounded-xl"><Search size={16} className="text-emerald-600" /></div>
                <span className="font-bold text-slate-800 text-sm">Search Console</span>
                {gscConnected && (
                  <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">연결됨</span>
                )}
              </div>
              {gscConnected ? (
                <div className="flex items-center gap-2">
                  <Link2 size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-emerald-800 flex-1 truncate">{gscStatus?.email}</span>
                  <button onClick={handleGscDisconnect} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors shrink-0">
                    <Link2Off size={12} /> 해제
                  </button>
                </div>
              ) : (
                <a href="/api/gsc/connect"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all">
                  <Link2 size={14} /> Search Console 연결
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Settings panel (shown if at least one connected) ── */}
        {anyConnected && session?.user && (
          <div className="space-y-5 border-t border-slate-100 pt-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GA4 property selector */}
              {ga4Connected && (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block flex items-center gap-1">
                    <span className="w-3 h-3 bg-indigo-600 rounded-full inline-block" /> GA4 속성
                  </label>
                  {ga4Status?.properties && ga4Status.properties.length > 0 ? (
                    <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={loading}
                      className="w-full pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm">
                      <option value="">속성 선택...</option>
                      {ga4Status.properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.displayName} — {p.account} (ID: {p.id})</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" placeholder="GA4 Property ID (예: 123456789)"
                      className="w-full pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={loading} />
                  )}
                </div>
              )}

              {/* GSC site selector */}
              {gscConnected && (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-600 rounded-full inline-block" /> Search Console 사이트
                  </label>
                  {gscStatus?.sites && gscStatus.sites.length > 0 ? (
                    <select value={gscSiteUrl} onChange={(e) => setGscSiteUrl(e.target.value)} disabled={loading}
                      className="w-full pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm">
                      {gscStatus.sites.map((s) => (
                        <option key={s.siteUrl} value={s.siteUrl}>{s.label}{s.isDomain ? ' (도메인 속성)' : ''}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={gscSiteUrl} onChange={(e) => setGscSiteUrl(e.target.value)} disabled={loading}
                      placeholder="예: https://example.com/ 또는 sc-domain:example.com"
                      className="w-full pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" />
                  )}
                </div>
              )}
            </div>

            {/* Period presets (for GSC) */}
            {gscConnected && (
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">분석 기간 (Search Console)</label>
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
                  <div className="grid grid-cols-2 gap-3 mb-3">
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
                <div className="text-[11px] text-slate-400">
                  📍 기준: {activePeriod.start} ~ {activePeriod.end}
                  {activePeriod.compareStart && <span className="ml-3">vs {activePeriod.compareStart} ~ {activePeriod.compareEnd}</span>}
                </div>
              </div>
            )}

            {/* GA4 install checker */}
            <div className="border-t border-slate-100 pt-5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-indigo-500" /> GA4 설치 확인 (선택)
              </div>
              <div className="flex gap-3">
                <input type="url" placeholder="https://yoursite.com"
                  className="flex-1 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  value={installUrl} onChange={(e) => setInstallUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkInstall()} disabled={checkLoading} />
                <button onClick={checkInstall} disabled={checkLoading || !installUrl.trim()}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap text-sm">
                  {checkLoading ? <><Loader2 size={14} className="animate-spin" /> 확인 중...</> : '설치 확인'}
                </button>
              </div>
              {checkResult && (
                <div className={'mt-3 p-4 rounded-2xl border ' + (checkResult.installed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200')}>
                  <div className="flex items-center gap-2 mb-2">
                    {checkResult.installed ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-rose-500" />}
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

            {/* ── Main CTA ── */}
            <button onClick={fetchAll} disabled={loading || !canFetch}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-base">
              {loading ? <><Loader2 size={18} className="animate-spin" /> 데이터 수집 중...</> : <><Zap size={18} /> 통합 분석 시작</>}
            </button>
            {!canFetch && !loading && (
              <p className="text-xs text-center text-slate-400">GA4 속성 또는 Search Console 사이트를 선택해야 분석할 수 있습니다.</p>
            )}
          </div>
        )}

        {error && <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>}
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── Dashboard (shown after analysis) ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {(ga4Data || gscData) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* ── Combined KPI Strip ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* GA4 KPIs — indigo */}
            {ga4Data ? (
              <>
                <KpiMiniCard label="세션" value={formatNumber(ga4Data.totals.sessions)} color="indigo" />
                <KpiMiniCard label="활성사용자" value={formatNumber(ga4Data.totals.activeUsers)} color="indigo" />
                <KpiMiniCard label="이탈률" value={ga4Data.totals.avgBounceRate + '%'} color="indigo" warn={ga4Data.totals.avgBounceRate > 60} />
                <KpiMiniCard label="세션시간" value={formatDuration(ga4Data.totals.avgSessionDuration)} color="indigo" />
              </>
            ) : (
              <>
                <KpiMiniCardEmpty label="세션" color="indigo" />
                <KpiMiniCardEmpty label="활성사용자" color="indigo" />
                <KpiMiniCardEmpty label="이탈률" color="indigo" />
                <KpiMiniCardEmpty label="세션시간" color="indigo" />
              </>
            )}

            {/* GSC KPIs — emerald */}
            {gscData ? (
              <>
                <KpiMiniCard label="클릭수" value={formatNumber(gscData.totals.clicks)} color="emerald" delta={gscDeltas?.clicks ?? null} />
                <KpiMiniCard label="노출수" value={formatNumber(gscData.totals.impressions)} color="emerald" delta={gscDeltas?.impressions ?? null} />
                <KpiMiniCard label="평균CTR" value={fmtCtr(gscData.totals.avgCtr)} color="emerald" delta={gscDeltas?.ctr ?? null} />
                <KpiMiniCard label="평균순위" value={fmtPos(gscData.totals.avgPosition)} color="emerald" delta={gscDeltas?.position ?? null} deltaUnit="위" invertDelta />
              </>
            ) : (
              <>
                <KpiMiniCardEmpty label="클릭수" color="emerald" />
                <KpiMiniCardEmpty label="노출수" color="emerald" />
                <KpiMiniCardEmpty label="평균CTR" color="emerald" />
                <KpiMiniCardEmpty label="평균순위" color="emerald" />
              </>
            )}
          </div>

          {/* ── Cross-page analysis table (both connected + data loaded) ── */}
          {bothConnected && ga4Data && gscData && crossPages.length > 0 && (
            <Card className="border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-emerald-100 rounded-xl">
                      <GitMerge size={18} className="text-slate-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">GA4 × Search Console 교차 분석</h4>
                      <p className="text-xs text-slate-500 mt-0.5">GA4 페이지 행동 데이터와 GSC 검색 성과를 페이지 단위로 교차합니다</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-2 text-[10px] font-black text-slate-400 uppercase">페이지 경로</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-indigo-400 uppercase">GA4 PV</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-indigo-400 uppercase">이탈률</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-indigo-400 uppercase">체류시간</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-emerald-500 uppercase">GSC 클릭</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-emerald-500 uppercase">CTR</th>
                        <th className="text-right py-2 px-2 text-[10px] font-black text-emerald-500 uppercase">순위</th>
                        <th className="text-left py-2 px-2 text-[10px] font-black text-slate-400 uppercase">진단</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(expandedCross ? crossPages : crossPages.slice(0, 10)).map((p, i) => {
                        const diagConfig = {
                          '랜딩 개선 필요': { icon: '🔴', cls: 'bg-rose-100 text-rose-700' },
                          '제목 최적화': { icon: '🟡', cls: 'bg-amber-100 text-amber-700' },
                          '콘텐츠 개선': { icon: '🟡', cls: 'bg-amber-100 text-amber-700' },
                          '양호': { icon: '🟢', cls: 'bg-emerald-100 text-emerald-700' },
                        }[p.diagnosis];
                        return (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-2 font-medium text-slate-700 max-w-[160px] truncate" title={p.path}>{p.path}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-slate-800">{formatNumber(p.pageViews)}</td>
                            <td className={'py-2.5 px-2 text-right font-bold ' + (p.bounceRate > 0.7 ? 'text-rose-600' : p.bounceRate > 0.55 ? 'text-amber-600' : 'text-emerald-600')}>
                              {Math.round(p.bounceRate * 100)}%
                            </td>
                            <td className="py-2.5 px-2 text-right text-slate-600">{formatDuration(Math.round(p.avgDuration))}</td>
                            <td className="py-2.5 px-2 text-right text-slate-600">{p.gsc ? formatNumber(p.gsc.clicks) : <span className="text-slate-300">—</span>}</td>
                            <td className="py-2.5 px-2 text-right">
                              {p.gsc ? (
                                <span className={p.gsc.ctr >= 0.05 ? 'text-emerald-600 font-bold' : p.gsc.ctr >= 0.02 ? 'text-amber-600' : 'text-rose-500'}>
                                  {fmtCtr(p.gsc.ctr)}
                                </span>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              {p.gsc ? (
                                <span className={'font-bold px-1.5 py-0.5 rounded-lg ' + (p.gsc.position <= 3 ? 'bg-emerald-100 text-emerald-700' : p.gsc.position <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                                  {fmtPos(p.gsc.position)}
                                </span>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-2.5 px-2">
                              <span className={'text-[10px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap ' + diagConfig.cls}>
                                {diagConfig.icon} {p.diagnosis}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {crossPages.length > 10 && (
                  <button onClick={() => setExpandedCross(!expandedCross)} className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
                    {expandedCross ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expandedCross ? '접기' : `나머지 ${crossPages.length - 10}개 더 보기`}
                  </button>
                )}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                  🔴 랜딩 개선 필요: GSC CTR {'>'} 3% AND 이탈률 {'>'} 70% — 콘텐츠-의도 불일치 가능성 &nbsp;|&nbsp;
                  🟡 제목 최적화: 노출 {'>'} 100 AND CTR {'<'} 2% — 검색결과 제목 개선 필요 &nbsp;|&nbsp;
                  🟡 콘텐츠 개선: 이탈률 {'>'} 65% AND 체류 {'<'} 60초 — 참여도 저조
                </div>
              </div>
            </Card>
          )}

          {/* Cross-page placeholder — only GA4 connected */}
          {ga4Connected && !gscConnected && ga4Data && (
            <Card className="p-6 border-dashed border-slate-200">
              <div className="flex items-center gap-3 text-slate-400">
                <GitMerge size={20} />
                <p className="text-sm">GSC를 연결하면 GA4 × Search Console 교차 분석이 가능합니다.</p>
                <a href="/api/gsc/connect" className="ml-auto shrink-0 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all">
                  Search Console 연결
                </a>
              </div>
            </Card>
          )}

          {/* ── AI Overview Candidates (GSC) ── */}
          {gscData && gscData.aiOverviewCandidates.length > 0 && (
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
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-lg">{gscData.aiOverviewCandidates.length}개 페이지</span>
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <Info size={13} className="shrink-0 mt-0.5" />
                  <span>이 페이지들은 경쟁사에게 밀린 것이 아닙니다. 콘텐츠 내용 자체가 AI 답변으로 소비되는 중입니다.
                    <strong> 단순 정보 나열 → 상담 유도형 CTA 강화</strong> 전략으로 전환을 권장합니다.</span>
                </div>
                <div className="mt-4 space-y-2">
                  {(expandedAI ? gscData.aiOverviewCandidates : gscData.aiOverviewCandidates.slice(0, 4)).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white border border-amber-100 rounded-xl hover:border-amber-200 transition-colors">
                      <div className="w-6 h-6 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-700 truncate" title={p.page}>{shortPage(p.page)}</div>
                        <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                          <span>노출 {formatNumber(p.impressions)}</span>
                          <span>순위 {fmtPos(p.position)}위</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-rose-600">CTR {fmtCtr(p.ctr)}</div>
                        <DeltaBadge value={p.ctrDrop} unit="%" />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400">순위 변화</div>
                        <div className="text-xs font-bold text-emerald-600">↑{Math.round(p.prevPosition - p.position)}위</div>
                      </div>
                    </div>
                  ))}
                </div>
                {gscData.aiOverviewCandidates.length > 4 && (
                  <button onClick={() => setExpandedAI(!expandedAI)} className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
                    {expandedAI ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expandedAI ? '접기' : `나머지 ${gscData.aiOverviewCandidates.length - 4}개 더 보기`}
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* ── Near Miss Keywords ── */}
          {gscData && gscData.nearMissQueries.length > 0 && (
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
                      {(expandedNearMiss ? gscData.nearMissQueries : gscData.nearMissQueries.slice(0, 8)).map((q, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-2 font-medium text-slate-700">{q.query}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={'font-bold text-xs px-2 py-0.5 rounded-lg ' + (q.position <= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                              {fmtPos(q.position)}위
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-600 text-xs">{formatNumber(q.impressions)}</td>
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
                {gscData.nearMissQueries.length > 8 && (
                  <button onClick={() => setExpandedNearMiss(!expandedNearMiss)} className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
                    {expandedNearMiss ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expandedNearMiss ? '접기' : `나머지 ${gscData.nearMissQueries.length - 8}개 더 보기`}
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* ── CTR Opportunities ── */}
          {gscData && gscData.ctrOpportunities.length > 0 && (
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
                  {gscData.ctrOpportunities.slice(0, 6).map((q, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm text-slate-700 flex-1">{q.query}</span>
                      <span className="text-xs text-slate-500 shrink-0">{formatNumber(q.impressions)} 노출</span>
                      <span className="text-xs font-bold text-rose-600 shrink-0">CTR {fmtCtr(q.ctr)}</span>
                      <span className="text-xs text-slate-400 shrink-0">{fmtPos(q.position)}위</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ── GSC placeholder if only GA4 ── */}
          {ga4Connected && !gscConnected && ga4Data && (
            <Card className="p-5 border-dashed border-emerald-100">
              <p className="text-sm text-slate-400 text-center">GSC를 연결하면 AI Overview 감지, Near Miss 키워드, CTR 최적화 섹션이 표시됩니다.</p>
            </Card>
          )}

          {/* ── Trend chart (GA4) ── */}
          {ga4Data && (
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" /> 최근 30일 세션 추이
              </h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData}>
                    <defs>
                      <linearGradient id="miSession" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="세션" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#miSession)" />
                    <Area type="monotone" dataKey="신규사용자" stroke="#10b981" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* ── Channel + Device breakdown (GA4) ── */}
          {ga4Data && (
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
          )}

          {/* ── Page improvement scoring (GA4) ── */}
          {ga4Data && scoredPages.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Wrench size={18} className="text-amber-500" /> 페이지 개선 진단
                  {problemPages.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-black rounded-full">
                      {problemPages.filter((p) => p.priority === '긴급').length}긴급 {problemPages.filter((p) => p.priority === '주의').length}주의
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
                  <button onClick={() => setShowPageReport(!showPageReport)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
                    {showPageReport ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showPageReport ? '접기' : '개선안 보기'}
                  </button>
                )}
              </div>

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

          {/* ── AI Insight section ── */}
          {(insightLoading || insight) && (
            <div className="space-y-5">
              {insightLoading && !insight ? (
                <Card className="p-10 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">AI가 데이터를 분석하고 있습니다...</span>
                  <span className="text-xs text-slate-400">GA4 + GSC 교차 인사이트, 채널 리스크, 개선안을 도출 중</span>
                </Card>
              ) : insight ? (
                <InsightReport insight={insight} />
              ) : null}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────────────
function pct(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

// ── KPI Mini Card ──────────────────────────────────────────────────────────
function KpiMiniCard({ label, value, color, delta, deltaUnit = '%', invertDelta = false, warn = false }: {
  label: string; value: string; color: 'indigo' | 'emerald';
  delta?: number | null; deltaUnit?: string; invertDelta?: boolean; warn?: boolean;
}) {
  const borderCls = color === 'indigo' ? 'border-indigo-100' : 'border-emerald-100';
  const labelCls = color === 'indigo' ? 'text-indigo-500' : 'text-emerald-600';
  const valueCls = warn ? 'text-rose-600' : 'text-slate-800';
  return (
    <div className={'p-4 bg-white border rounded-2xl shadow-sm ' + borderCls}>
      <div className={'text-[10px] font-black uppercase tracking-widest mb-1.5 ' + labelCls}>{label}</div>
      <div className={'text-xl font-black ' + valueCls}>{value}</div>
      {delta !== undefined && delta !== null && (
        <div className="mt-1">
          <DeltaBadge value={delta} unit={deltaUnit} invert={invertDelta} />
        </div>
      )}
    </div>
  );
}

function KpiMiniCardEmpty({ label, color }: { label: string; color: 'indigo' | 'emerald' }) {
  const borderCls = color === 'indigo' ? 'border-indigo-50' : 'border-emerald-50';
  const labelCls = color === 'indigo' ? 'text-indigo-300' : 'text-emerald-300';
  return (
    <div className={'p-4 bg-slate-50 border rounded-2xl ' + borderCls}>
      <div className={'text-[10px] font-black uppercase tracking-widest mb-1.5 ' + labelCls}>{label}</div>
      <div className="text-xl font-black text-slate-200">—</div>
    </div>
  );
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
          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp size={12} /> 트렌드 분석</div>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.trendNarrative}</p>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Globe size={12} /> 채널 인사이트</div>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.channelInsight}</p>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Users size={12} /> 오디언스 분석</div>
          <p className="text-sm text-slate-700 leading-relaxed">{insight.audienceInsight}</p>
        </Card>
      </div>

      {/* ── Strengths & Risks ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} className="text-emerald-500" /> 현재 잘 되고 있는 것
          </h4>
          <div className="space-y-3">
            {(insight.strengths ?? []).map((s, i) => (
              <div key={i} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-sm font-bold text-emerald-800 mb-1">{typeof s === 'object' ? s.title : s}</div>
                {typeof s === 'object' && s.detail && <p className="text-xs text-emerald-700 leading-relaxed">{s.detail}</p>}
              </div>
            ))}
          </div>
        </Card>
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
                        <Zap size={10} className="shrink-0 mt-0.5" fill="currentColor" />{r.action}
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
                  {g.kpi && <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1">📊 {g.kpi}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ── Quarterly Vision ── */}
      {insight.quarterlyVision && (
        <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-indigo-600 rounded-xl shrink-0"><TrendingUp size={16} /></div>
          <div>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">3개월 비전</div>
            <p className="text-sm text-slate-300 leading-relaxed">{insight.quarterlyVision}</p>
          </div>
        </div>
      )}
    </>
  );
}
