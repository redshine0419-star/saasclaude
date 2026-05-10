'use client';

import { useState } from 'react';
import { Globe, Loader2, ArrowLeftRight, TrendingUp, TrendingDown, Minus, Zap, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

interface SiteData {
  analyze: {
    mobile: { scores: Record<string, number>; vitals: Record<string, string> };
    desktop: { scores: Record<string, number> };
  };
  geo: {
    score: number;
    issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
    llmsTxt: { exists: boolean };
    jsonLd: { exists: boolean; types: string[] };
    robotsTxt: { llmBlocked: boolean };
    metaTags: { description: string | null; canonical: string | null };
    headings: { h1: string[] };
  };
}

interface CompareResult {
  summary: string;
  myStrengths: string[];
  myWeaknesses: string[];
  competitorStrengths: string[];
  opportunities: string[];
  priorityActions: { action: string; impact: 'High' | 'Medium' | 'Low'; effort: string }[];
}

function DeltaBadge({ a, b }: { a: number; b: number }) {
  const diff = a - b;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-black">+{diff} <TrendingUp size={12} /></span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-rose-500 text-xs font-black">{diff} <TrendingDown size={12} /></span>;
  return <span className="flex items-center gap-0.5 text-slate-400 text-xs font-black">= <Minus size={12} /></span>;
}

function ScoreRow({ label, a, b }: { label: string; a: number; b: number }) {
  const colorA = a >= 80 ? 'text-emerald-600' : a >= 50 ? 'text-amber-500' : 'text-rose-500';
  const colorB = b >= 80 ? 'text-emerald-600' : b >= 50 ? 'text-amber-500' : 'text-rose-500';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium w-24 shrink-0">{label}</span>
      <span className={'text-sm font-black w-10 text-right ' + colorA}>{a}</span>
      <div className="flex-1 flex items-center justify-center"><DeltaBadge a={a} b={b} /></div>
      <span className={'text-sm font-black w-10 ' + colorB}>{b}</span>
    </div>
  );
}

function ImpactColor(impact: string) {
  if (impact === 'High') return 'bg-rose-100 text-rose-700';
  if (impact === 'Medium') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export default function CompetitorModule({ onToast }: { onToast: (msg: string) => void }) {
  const [urlA, setUrlA] = useState('');
  const [urlB, setUrlB] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [dataA, setDataA] = useState<SiteData | null>(null);
  const [dataB, setDataB] = useState<SiteData | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!urlA.trim() || !urlB.trim()) return;
    setLoading(true);
    setError('');
    setDataA(null);
    setDataB(null);
    setCompareResult(null);

    try {
      setStep('두 사이트 동시 분석 중...');
      const [resAnalyzeA, resGeoA, resAnalyzeB, resGeoB] = await Promise.all([
        fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlA }) }),
        fetch('/api/geo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlA }) }),
        fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlB }) }),
        fetch('/api/geo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlB }) }),
      ]);

      if (!resAnalyzeA.ok) throw new Error('내 사이트 PageSpeed 분석 실패');
      if (!resAnalyzeB.ok) throw new Error('경쟁사 PageSpeed 분석 실패');

      const [analyzeA, geoA, analyzeB, geoB] = await Promise.all([
        resAnalyzeA.json(), resGeoA.json(), resAnalyzeB.json(), resGeoB.json(),
      ]);

      const siteA: SiteData = { analyze: analyzeA, geo: geoA };
      const siteB: SiteData = { analyze: analyzeB, geo: geoB };
      setDataA(siteA);
      setDataB(siteB);

      setStep('AI 경쟁 분석 중...');
      const compRes = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlA, urlB, dataA: siteA, dataB: siteB }),
      });
      const comp = await compRes.json();
      if (!compRes.ok) throw new Error(comp.error ?? 'AI 분석 실패');
      setCompareResult(comp);
      onToast('경쟁사 비교 분석이 완료되었습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  const geoCheckItems = dataA && dataB ? [
    { label: 'llms.txt', a: dataA.geo.llmsTxt.exists, b: dataB.geo.llmsTxt.exists },
    { label: 'JSON-LD', a: dataA.geo.jsonLd.exists, b: dataB.geo.jsonLd.exists },
    { label: 'AI 봇 허용', a: !dataA.geo.robotsTxt.llmBlocked, b: !dataB.geo.robotsTxt.llmBlocked },
    { label: 'Meta Description', a: !!dataA.geo.metaTags.description, b: !!dataB.geo.metaTags.description },
    { label: 'Canonical URL', a: !!dataA.geo.metaTags.canonical, b: !!dataB.geo.metaTags.canonical },
    { label: 'H1 태그', a: dataA.geo.headings.h1.length > 0, b: dataB.geo.headings.h1.length > 0 },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="p-6 md:p-8 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-lg">
            <ArrowLeftRight size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">경쟁사 비교 분석</h3>
            <p className="text-sm text-slate-500">두 사이트의 SEO GEO 성능 점수를 AI가 나란히 비교합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">내 사이트</label>
            <input
              type="url"
              placeholder="https://mysite.com"
              className="w-full pl-4 pr-4 py-3.5 bg-white border border-indigo-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
              value={urlA}
              onChange={(e) => setUrlA(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide mb-2 block">경쟁사 사이트</label>
            <input
              type="url"
              placeholder="https://competitor.com"
              className="w-full pl-4 pr-4 py-3.5 bg-white border border-rose-200 rounded-2xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all shadow-sm text-sm"
              value={urlB}
              onChange={(e) => setUrlB(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <button
          onClick={analyze}
          disabled={loading || !urlA.trim() || !urlB.trim()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> {step}</> : <><Zap size={18} /> 경쟁사 비교 분석 시작</>}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>
        )}
      </Card>

      {dataA && dataB && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-slate-800">점수 비교</h4>
              <div className="flex items-center gap-6 text-xs font-black">
                <span className="text-indigo-600">내 사이트</span>
                <span className="text-rose-500">경쟁사</span>
              </div>
            </div>
            <ScoreRow label="Performance" a={dataA.analyze.mobile.scores.performance} b={dataB.analyze.mobile.scores.performance} />
            <ScoreRow label="SEO" a={dataA.analyze.mobile.scores.seo} b={dataB.analyze.mobile.scores.seo} />
            <ScoreRow label="Accessibility" a={dataA.analyze.mobile.scores.accessibility} b={dataB.analyze.mobile.scores.accessibility} />
            <ScoreRow label="GEO Score" a={dataA.geo.score} b={dataB.geo.score} />
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4">GEO 체크리스트 비교</h4>
            <div className="space-y-2">
              {geoCheckItems.map((item) => (
                <div key={item.label} className="grid grid-cols-3 gap-3 items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-xs font-medium text-slate-500 text-center">{item.label}</span>
                  <div className={'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold ' + (item.a ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600')}>
                    {item.a ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {item.a ? '통과' : '미흡'}
                  </div>
                  <div className={'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold ' + (item.b ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600')}>
                    {item.b ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {item.b ? '통과' : '미흡'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {compareResult && (
            <>
              <div className="p-5 bg-indigo-950 text-white rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-indigo-400" fill="currentColor" />
                  <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">AI 종합 진단</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{compareResult.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-emerald-500" /> 내 사이트 강점
                  </h4>
                  <ul className="space-y-2">
                    {compareResult.myStrengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-xs font-black text-slate-500 mb-2">보완 필요</div>
                    <ul className="space-y-2">
                      {compareResult.myWeaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                <Card className="p-5">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                    <Globe size={16} className="text-rose-500" /> 경쟁사 주요 강점
                  </h4>
                  <ul className="space-y-2 mb-4">
                    {compareResult.competitorStrengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <TrendingUp size={14} className="text-rose-400 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-xs font-black text-slate-500 mb-2">역전 기회</div>
                    <ul className="space-y-2">
                      {compareResult.opportunities.map((o, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <Zap size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h4 className="font-bold text-slate-800 mb-4">우선순위 실행 액션</h4>
                <div className="space-y-3">
                  {compareResult.priorityActions.map((a, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                      <div className="w-7 h-7 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                      <p className="text-sm text-slate-700 font-medium flex-1">{a.action}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={'text-[10px] font-black px-2 py-0.5 rounded-full ' + ImpactColor(a.impact)}>{a.impact}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{a.effort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
