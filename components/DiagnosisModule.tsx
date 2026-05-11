'use client';

import { useState } from 'react';
import {
  Globe, Loader2, Sparkles, Copy, CheckCircle2, AlertCircle,
  Smartphone, Monitor, ShieldCheck, FileText, Image,
} from 'lucide-react';
import { saveDiagnosis } from '@/lib/storage';
import AdUnit from '@/components/AdUnit';

// ---- shared ui ----
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) => {
  const styles: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    primary: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[variant] ?? styles.default}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

// ---- score ring ----
const ScoreRing = ({ score, label, sub }: { score: number | string; label: string; sub: string }) => {
  const num = typeof score === 'number' ? score : null;
  const color =
    num === null ? 'border-indigo-500' :
    num >= 80 ? 'border-emerald-500' :
    num >= 50 ? 'border-amber-500' :
    'border-rose-500';
  const textColor =
    num === null ? 'text-indigo-600' :
    num >= 80 ? 'text-emerald-600' :
    num >= 50 ? 'text-amber-600' :
    'text-rose-600';

  return (
    <Card className="p-6 flex flex-col items-center text-center">
      <div className={`w-20 h-20 rounded-full border-4 ${color} flex items-center justify-center mb-4`}>
        <span className={`text-xl font-black ${textColor}`}>{score}</span>
      </div>
      <h4 className="font-bold text-slate-800">{label}</h4>
      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{sub}</p>
    </Card>
  );
};

// ---- types ----
interface AnalyzeResult {
  mobile: { scores: Record<string, number>; vitals: Record<string, string>; opportunities: { title: string; description: string; score: number | null }[] };
  desktop: { scores: Record<string, number>; vitals: Record<string, string>; opportunities: { title: string; description: string; score: number | null }[] };
}

interface GeoResult {
  llmsTxt: { exists: boolean };
  robotsTxt: { exists: boolean; llmBlocked: boolean };
  jsonLd: { exists: boolean; types: string[]; count: number };
  metaTags: { title: string | null; description: string | null; ogTitle: string | null; canonical: string | null };
  headings: { h1: string[]; h2: string[] };
  images: { total: number; missingAlt: number };
  score: number;
  issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
}

// ---- main component ----
export default function DiagnosisModule({ onToast }: { onToast: (msg: string) => void }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [step, setStep] = useState('');
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResult | null>(null);
  const [geoData, setGeoData] = useState<GeoResult | null>(null);
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const startAnalysis = async () => {
    if (!url.trim()) return;
    setStatus('scanning');
    setError('');
    setAnalyzeData(null);
    setGeoData(null);
    setAdvice(null);

    try {
      setStep('PageSpeed Insights 분석 중...');
      const [analyzeRes, geoRes] = await Promise.all([
        fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }),
        fetch('/api/geo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }),
      ]);

      if (!analyzeRes.ok) {
        const e = await analyzeRes.json();
        throw new Error(e.error ?? 'PageSpeed API 오류');
      }
      if (!geoRes.ok) {
        const e = await geoRes.json();
        throw new Error(e.error ?? 'GEO 분석 오류');
      }

      setStep('결과 처리 중...');
      const [aData, gData] = await Promise.all([analyzeRes.json(), geoRes.json()]);
      setAnalyzeData(aData);
      setGeoData(gData);
      setStatus('complete');

      saveDiagnosis({
        url,
        timestamp: Date.now(),
        scores: {
          performance: aData.mobile.scores.performance,
          seo: aData.mobile.scores.seo,
          accessibility: aData.mobile.scores.accessibility,
          geo: gData.score,
        },
      });

      // AI 어드바이저 비동기 호출
      setAdviceLoading(true);
      fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, geoData: gData, analyzeData: aData }),
      })
        .then((r) => r.json())
        .then((d) => setAdvice(d.advice ?? null))
        .catch(() => setAdvice(null))
        .finally(() => setAdviceLoading(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
      setStatus('error');
    }
  };

  const current = analyzeData?.[strategy];

  const impactVariant = (impact: string) =>
    impact === 'High' ? 'danger' : impact === 'Medium' ? 'warning' : 'default';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Input Card */}
      <Card className="p-6 md:p-8 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-lg">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">GEO & SEO 기술 엔진 진단</h3>
            <p className="text-sm text-slate-500">PageSpeed Insights + HTML 파싱으로 실제 데이터를 분석합니다.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="url"
              placeholder="분석할 URL (예: https://example.com)"
              className="w-full pl-5 pr-12 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startAnalysis()}
              disabled={status === 'scanning'}
            />
            {status === 'scanning' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600">
                <Loader2 className="animate-spin" size={20} />
              </div>
            )}
          </div>
          <button
            onClick={startAnalysis}
            disabled={status === 'scanning' || !url.trim()}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {status === 'scanning' ? (
              <><Loader2 size={18} className="animate-spin" /> {step}</>
            ) : 'AI 진단 엔진 가동'}
          </button>
        </div>

        {status === 'error' && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm text-rose-700">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        )}
      </Card>

      {/* Results */}
      {status === 'complete' && analyzeData && geoData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Strategy Toggle */}
          <div className="flex gap-2 justify-end">
            {(['mobile', 'desktop'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  strategy === s ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {s === 'mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
                {s === 'mobile' ? '모바일' : '데스크탑'}
              </button>
            ))}
          </div>

          {/* Score Rings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreRing score={current!.scores.performance} label="Performance" sub="Core Web Vitals 종합 점수" />
            <ScoreRing score={current!.scores.seo} label="SEO" sub="검색엔진 최적화 점수" />
            <ScoreRing score={current!.scores.accessibility} label="Accessibility" sub="접근성 점수" />
            <ScoreRing score={geoData.score} label="GEO Visibility" sub="AI 가독성 및 LLM 크롤링 점수" />
          </div>

          {/* Core Web Vitals */}
          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4">Core Web Vitals</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(current!.vitals).map(([key, val]) => (
                <div key={key} className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400 uppercase font-bold mb-1">{key.toUpperCase()}</div>
                  <div className="font-black text-slate-800 text-sm">{val}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* GEO Checklist */}
          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-600" />
              GEO 체크리스트
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'llms.txt', ok: geoData.llmsTxt.exists, good: 'AI 봇 가이드 파일 존재', bad: 'llms.txt 없음 — AI 학습 효율 저하' },
                { label: 'JSON-LD', ok: geoData.jsonLd.exists, good: `구조화 데이터 ${geoData.jsonLd.count}개 (${geoData.jsonLd.types.join(', ')})`, bad: 'JSON-LD 없음 — 검색 스니펫 표시 불가' },
                { label: 'robots.txt', ok: !geoData.robotsTxt.llmBlocked, good: 'AI 봇 허용', bad: 'GPTBot/ClaudeBot 차단됨' },
                { label: 'Meta Description', ok: !!geoData.metaTags.description, good: (geoData.metaTags.description?.slice(0, 60) ?? '') + '…', bad: 'Meta Description 없음' },
                { label: 'Canonical URL', ok: !!geoData.metaTags.canonical, good: '설정됨', bad: 'Canonical URL 미설정' },
                { label: 'H1 태그', ok: geoData.headings.h1.length > 0, good: `"${geoData.headings.h1[0]}"`, bad: 'H1 태그 없음' },
                { label: '이미지 Alt', ok: geoData.images.missingAlt === 0, good: `전체 ${geoData.images.total}개 Alt 완비`, bad: `${geoData.images.missingAlt}/${geoData.images.total}개 Alt 누락` },
              ].map((item) => (
                <div key={item.label} className={`flex items-start gap-3 p-3 rounded-xl ${item.ok ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  {item.ok ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />}
                  <div>
                    <div className="text-xs font-black text-slate-500 uppercase tracking-wide">{item.label}</div>
                    <div className={`text-xs mt-0.5 font-semibold ${item.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {item.ok ? item.good : item.bad}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Issues & Opportunities */}
          {/* AI 어드바이저 */}
          {(adviceLoading || advice) && (
            <Card className="p-6 border-indigo-200 bg-gradient-to-br from-indigo-950 to-slate-900 text-white">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-indigo-300">
                <Sparkles size={18} className="text-indigo-400 animate-pulse" />
                AI 시니어 마케터 종합 진단
              </h4>
              {adviceLoading ? (
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                  AI가 진단 결과를 분석하고 있습니다...
                </div>
              ) : (
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {advice}
                </div>
              )}
            </Card>
          )}

          <AdUnit slot="1234567890" />

          {(geoData.issues.length > 0 || current!.opportunities.length > 0) && (
            <Card className="p-6 bg-slate-900 text-white">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                즉각 개선 패치 제안
              </h4>
              <div className="space-y-3">
                {geoData.issues.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold">{item.title}</span>
                        <Badge variant={impactVariant(item.impact)}>{item.impact}</Badge>
                      </div>
                      <p className="text-xs text-slate-200">{item.detail}</p>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(item.detail); onToast('클립보드에 복사되었습니다.'); }}
                      className="ml-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-indigo-400 shrink-0"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                ))}
                {current!.opportunities.map((op, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold">{op.title}</span>
                        <Badge variant="primary">Performance</Badge>
                      </div>
                      <p className="text-xs text-slate-200">{op.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
