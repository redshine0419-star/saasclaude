'use client';

import { useState } from 'react';
import {
  BarChart3, Loader2, CheckCircle2, XCircle, AlertCircle, Zap,
  TrendingUp, TrendingDown, Users, Globe, Monitor, Smartphone, Tablet,
  ChevronDown, ChevronUp, Eye, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

interface CheckResult {
  installed: boolean;
  measurementIds: string[];
  hasGTM: boolean;
  gtmIds: string[];
  gtagScriptFound: boolean;
  hasDataLayer: boolean;
  issues: string[];
}

interface GA4Data {
  totals: { sessions: number; activeUsers: number; newUsers: number; pageViews: number; avgBounceRate: number; avgSessionDuration: number };
  trend: { date: string; sessions: number; activeUsers: number; newUsers: number; pageViews: number; bounceRate: number }[];
  channels: { channel: string; sessions: number; activeUsers: number; conversions: number }[];
  topPages: { path: string; title: string; pageViews: number; avgDuration: number; bounceRate: number; activeUsers: number }[];
  devices: { device: string; sessions: number; activeUsers: number }[];
}

interface InsightResult {
  healthScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  trafficInsight: string;
  contentInsight: string;
  quickWins: { action: string; expectedImpact: string; effort: string }[];
  monthlyGoals: { goal: string; strategy: string }[];
}

const DEVICE_ICON: Record<string, React.ReactNode> = {
  mobile: <Smartphone size={14} />,
  desktop: <Monitor size={14} />,
  tablet: <Tablet size={14} />,
};

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#6366f1',
  'Direct': '#10b981',
  'Referral': '#f59e0b',
  'Organic Social': '#ec4899',
  'Paid Search': '#8b5cf6',
  'Email': '#06b6d4',
  'Unassigned': '#94a3b8',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#94a3b8'];

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="p-5">
      <div className={'inline-flex p-2 rounded-xl mb-3 ' + color}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="text-2xl font-black text-slate-800">{value}</div>
      <div className="text-[11px] text-slate-400 font-medium mt-1">{label}</div>
      {sub && <div className="text-[10px] text-slate-300 mt-0.5">{sub}</div>}
    </Card>
  );
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + 'm ' + s + 's';
}

function formatNumber(n: number) {
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString();
}

function healthColor(score: number) {
  if (score >= 75) return { ring: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: '양호' };
  if (score >= 50) return { ring: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: '보통' };
  return { ring: 'border-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', label: '개선 필요' };
}

export default function GA4Module({ onToast }: { onToast: (msg: string) => void }) {
  const [siteUrl, setSiteUrl] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const [propertyId, setPropertyId] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);

  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<InsightResult | null>(null);

  const [error, setError] = useState('');

  const checkInstall = async () => {
    if (!siteUrl.trim()) return;
    setCheckLoading(true);
    setCheckResult(null);
    setError('');
    try {
      const res = await fetch('/api/ga4/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: siteUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || `서버 오류 (${res.status})`);
      setCheckResult(data);
      onToast('GA4 설치 확인이 완료됐습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setCheckLoading(false);
    }
  };

  const fetchGA4Data = async () => {
    if (!propertyId.trim() || !serviceKey.trim()) return;
    setDataLoading(true);
    setGa4Data(null);
    setInsight(null);
    setError('');
    try {
      const res = await fetch('/api/ga4/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, serviceAccountKey: serviceKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || `서버 오류 (${res.status})`);
      setGa4Data(data);
      onToast('GA4 데이터를 불러왔습니다.');

      // AI 분석 자동 실행
      setInsightLoading(true);
      const aRes = await fetch('/api/ga4/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, siteUrl }),
      });
      const aData = await aRes.json();
      if (aRes.ok) setInsight(aData);
      onToast('AI 인사이트 분석이 완료됐습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setDataLoading(false);
      setInsightLoading(false);
    }
  };

  const hc = insight ? healthColor(insight.healthScore) : null;
  const trendChartData = (ga4Data?.trend ?? []).map((t) => ({
    date: t.date.slice(4, 6) + '/' + t.date.slice(6, 8),
    세션: t.sessions,
    신규사용자: t.newUsers,
  }));

  const totalSessions = ga4Data?.channels.reduce((a, c) => a + c.sessions, 0) ?? 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 md:p-8 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-lg">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">GA4 인사이트 분석</h3>
            <p className="text-sm text-slate-500">GA4 설치 확인부터 데이터 연동·AI 인사이트까지 한 번에.</p>
          </div>
        </div>

        {/* STEP 1: 설치 확인 */}
        <div className="space-y-4">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
            GA4 설치 확인
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              placeholder="https://yoursite.com"
              className="flex-1 pl-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkInstall()}
              disabled={checkLoading}
            />
            <button
              onClick={checkInstall}
              disabled={checkLoading || !siteUrl.trim()}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {checkLoading ? <><Loader2 size={16} className="animate-spin" /> 확인 중...</> : '설치 확인'}
            </button>
          </div>

          {checkResult && (
            <div className={'p-4 rounded-2xl border ' + (checkResult.installed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200')}>
              <div className="flex items-center gap-2 mb-3">
                {checkResult.installed
                  ? <CheckCircle2 size={18} className="text-emerald-600" />
                  : <XCircle size={18} className="text-rose-500" />}
                <span className={'font-bold text-sm ' + (checkResult.installed ? 'text-emerald-800' : 'text-rose-800')}>
                  {checkResult.installed ? 'GA4 설치 확인됨' : 'GA4 미설치'}
                </span>
              </div>
              {checkResult.measurementIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {checkResult.measurementIds.map((id) => (
                    <span key={id} className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-black rounded-lg">{id}</span>
                  ))}
                  {checkResult.gtmIds.map((id) => (
                    <span key={id} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-lg">{id} (GTM)</span>
                  ))}
                </div>
              )}
              {checkResult.issues.length > 0 && (
                <ul className="space-y-1">
                  {checkResult.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-rose-700">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" /> {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* STEP 2: Data API 연동 */}
        <div className="mt-6 space-y-4">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
            GA4 데이터 연동 (Data API)
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 leading-relaxed">
            <strong>연동 방법:</strong> Google Cloud Console → IAM → 서비스 계정 생성 → JSON 키 다운로드 →
            GA4 속성 관리자에서 해당 계정 이메일에 <strong>뷰어</strong> 권한 부여
          </div>

          <input
            type="text"
            placeholder="GA4 Property ID (예: 123456789)"
            className="w-full pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            disabled={dataLoading}
          />

          <div>
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
            >
              {showKeyInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              서비스 계정 키 JSON {showKeyInput ? '접기' : '입력'}
            </button>
            {showKeyInput && (
              <textarea
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-mono transition-all resize-none"
                placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "...",\n  "client_email": "..."\n}'}
                value={serviceKey}
                onChange={(e) => setServiceKey(e.target.value)}
                disabled={dataLoading}
              />
            )}
          </div>

          <button
            onClick={fetchGA4Data}
            disabled={dataLoading || !propertyId.trim() || !serviceKey.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            {dataLoading
              ? <><Loader2 size={18} className="animate-spin" /> 데이터 수집 중...</>
              : <><Zap size={18} /> GA4 데이터 불러오기 + AI 분석</>}
          </button>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>
          )}
        </div>
      </Card>

      {/* GA4 Data Dashboard */}
      {ga4Data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="총 세션" value={formatNumber(ga4Data.totals.sessions)} icon={<Globe size={16} />} color="bg-indigo-600" />
            <StatCard label="활성 사용자" value={formatNumber(ga4Data.totals.activeUsers)} sub={'신규 ' + formatNumber(ga4Data.totals.newUsers)} icon={<Users size={16} />} color="bg-emerald-500" />
            <StatCard label="평균 이탈률" value={ga4Data.totals.avgBounceRate + '%'} icon={<TrendingDown size={16} />} color={ga4Data.totals.avgBounceRate > 60 ? 'bg-rose-500' : 'bg-amber-500'} />
            <StatCard label="평균 세션 시간" value={formatDuration(ga4Data.totals.avgSessionDuration)} icon={<Clock size={16} />} color="bg-purple-500" />
          </div>

          {/* Trend Chart */}
          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" /> 최근 30일 세션 추이
            </h4>
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
            {/* Channel breakdown */}
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Globe size={18} className="text-indigo-600" /> 채널별 트래픽
              </h4>
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ga4Data.channels} layout="vertical">
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="channel" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                    <Bar dataKey="sessions" name="세션" radius={[0, 4, 4, 0]}>
                      {ga4Data.channels.map((c, i) => (
                        <Cell key={i} fill={CHANNEL_COLORS[c.channel] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
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
                    {c.conversions > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-lg">{c.conversions} 전환</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Device + Top pages */}
            <div className="space-y-4">
              <Card className="p-5">
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                  <Monitor size={16} className="text-indigo-600" /> 기기별
                </h4>
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
                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                  <Eye size={16} className="text-indigo-600" /> 상위 페이지
                </h4>
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

          {/* AI Insights */}
          {(insightLoading || insight) && (
            <div className="space-y-4">
              {insightLoading && !insight ? (
                <Card className="p-8 flex items-center justify-center gap-3 text-slate-500">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                  <span className="text-sm">AI가 GA4 데이터를 분석하고 있습니다...</span>
                </Card>
              ) : insight && (
                <>
                  {/* Health Score */}
                  <div className="flex items-stretch gap-4">
                    <Card className={'p-6 flex flex-col items-center justify-center min-w-[140px] ' + hc!.bg}>
                      <div className={'w-20 h-20 rounded-full border-4 flex items-center justify-center mb-2 ' + hc!.ring}>
                        <span className={'text-2xl font-black ' + hc!.text}>{insight.healthScore}</span>
                      </div>
                      <span className={'text-xs font-black ' + hc!.text}>{hc!.label}</span>
                      <span className="text-[10px] text-slate-400 mt-1">마케팅 건강도</span>
                    </Card>
                    <div className="flex-1 p-5 bg-indigo-950 text-white rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-indigo-400" fill="currentColor" />
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">AI 종합 진단</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed mb-4">{insight.summary}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] font-black text-emerald-400 mb-1.5">강점</div>
                          {insight.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 mb-1">
                              <CheckCircle2 size={11} className="text-emerald-400 shrink-0 mt-0.5" /> {s}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-rose-400 mb-1.5">위험 신호</div>
                          {insight.risks.map((r, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 mb-1">
                              <AlertCircle size={11} className="text-rose-400 shrink-0 mt-0.5" /> {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-5">
                      <div className="text-xs font-black text-indigo-600 uppercase tracking-wide mb-2">트래픽 인사이트</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{insight.trafficInsight}</p>
                    </Card>
                    <Card className="p-5">
                      <div className="text-xs font-black text-purple-600 uppercase tracking-wide mb-2">콘텐츠 성과 인사이트</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{insight.contentInsight}</p>
                    </Card>
                  </div>

                  {/* Quick Wins */}
                  <Card className="p-6">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Zap size={18} className="text-amber-500" /> 이번 주 Quick Win
                    </h4>
                    <div className="space-y-3">
                      {insight.quickWins.map((w, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                          <div className="w-7 h-7 bg-amber-500 text-white rounded-xl flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 mb-1">{w.action}</p>
                            <p className="text-xs text-slate-600">{w.expectedImpact}</p>
                          </div>
                          <span className={'text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ' + (w.effort === '낮음' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                            {w.effort}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Monthly Goals */}
                  <Card className="p-6">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-500" /> 이번 달 목표
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insight.monthlyGoals.map((g, i) => (
                        <div key={i} className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl">
                          <div className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black mb-3">{i + 1}</div>
                          <p className="text-sm font-bold text-slate-800 mb-2">{g.goal}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{g.strategy}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
