'use client';

import { useState } from 'react';
import {
  Bot, Loader2, AlertCircle, Globe, Zap, CheckCircle2, XCircle,
  MinusCircle, ChevronDown, ChevronUp, MessageSquare, TrendingUp,
} from 'lucide-react';
import { useAppLang } from '@/components/AppLangContext';
import { t } from '@/lib/app-i18n';

interface QuestionResult {
  question: string;
  answer: string;
  isMentioned: boolean;
  isRecommended: boolean;
  tone: 'positive' | 'neutral' | 'negative' | 'not_mentioned';
  score: number;
  analysis: string;
}

interface GeoSignal {
  label: string;
  status: 'good' | 'warning' | 'missing';
  detail: string;
}

interface AiSearchQualityResult {
  brandUrl: string;
  brandName: string;
  overallScore: number;
  questions: QuestionResult[];
  geoSignals: GeoSignal[];
  recommendations: { priority: number; title: string; detail: string }[];
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

function ToneChip({ tone }: { tone: QuestionResult['tone'] }) {
  const map = {
    positive:     { label: '긍정', className: 'bg-emerald-100 text-emerald-700' },
    neutral:      { label: '중립', className: 'bg-slate-100 text-slate-600' },
    negative:     { label: '부정', className: 'bg-rose-100 text-rose-700' },
    not_mentioned:{ label: '미언급', className: 'bg-slate-100 text-slate-400' },
  };
  const s = map[tone];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${s.className}`}>{s.label}</span>;
}

function SignalIcon({ status }: { status: GeoSignal['status'] }) {
  if (status === 'good') return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
  if (status === 'warning') return <MinusCircle size={16} className="text-amber-500 shrink-0" />;
  return <XCircle size={16} className="text-rose-400 shrink-0" />;
}

function scoreColor(score: number) {
  if (score >= 70) return { ring: 'border-emerald-500', text: 'text-emerald-600', label: '양호' };
  if (score >= 40) return { ring: 'border-amber-400', text: 'text-amber-600', label: '개선 필요' };
  return { ring: 'border-rose-500', text: 'text-rose-600', label: '위험' };
}

export default function AiSearchQualityModule({ onToast }: { onToast: (msg: string) => void }) {
  const { lang } = useAppLang();
  const [brandUrl, setBrandUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AiSearchQualityResult | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const run = async () => {
    if (!brandUrl.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai-search-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandUrl: brandUrl.trim(), brandName: brandName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `오류 (${res.status})`);
      setResult(data);
      onToast(`${data.brandName} AI 검색 품질 진단 완료 — ${data.overallScore}점`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const mentionCount = result?.questions.filter((q) => q.isMentioned).length ?? 0;
  const recommendCount = result?.questions.filter((q) => q.isRecommended).length ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Bot size={22} className="text-indigo-600" /> {t('aiSearch', 'title', lang)}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('aiSearch', 'subtitle', lang)}
        </p>
      </div>

      {/* Input */}
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">
              {t('aiSearch', 'siteUrl', lang)} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={brandUrl}
                onChange={(e) => setBrandUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && run()}
                placeholder="https://yoursite.com"
                className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">
              {t('aiSearch', 'brandName', lang)}
            </label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder={t('sov', 'companyNamePh', lang)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled={loading}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading || !brandUrl.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> {t('aiSearch', 'running', lang)}</>
              : <><Bot size={15} /> {t('aiSearch', 'runBtn', lang)}</>
            }
          </button>
          {loading && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" />
              {t('aiSearch', 'runningMsg', lang)}
            </span>
          )}
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {result && (
        <>
          {/* Score + stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const c = scoreColor(result.overallScore);
              return (
                <Card className="p-4 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-full border-4 ${c.ring} flex items-center justify-center mb-2`}>
                    <span className={`text-xl font-black ${c.text}`}>{result.overallScore}</span>
                  </div>
                  <div className="text-xs font-black text-slate-500">GEO 가시성</div>
                  <div className={`text-xs font-bold mt-0.5 ${c.text}`}>{c.label}</div>
                </Card>
              );
            })()}
            {[
              { label: 'AI 언급 횟수', value: `${mentionCount}/5`, sub: '질문 중 언급', color: mentionCount >= 3 ? 'text-emerald-600' : 'text-amber-600' },
              { label: '추천 포함', value: `${recommendCount}/5`, sub: '첫 추천에 등장', color: recommendCount >= 2 ? 'text-emerald-600' : 'text-rose-600' },
              { label: 'GEO 신호', value: `${result.geoSignals.filter((s) => s.status === 'good').length}/${result.geoSignals.length}`, sub: '최적화 항목', color: 'text-indigo-600' },
            ].map((m) => (
              <Card key={m.label} className="p-4 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{m.label}</div>
                <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
              </Card>
            ))}
          </div>

          {/* GEO signals */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-indigo-500" />
              <h3 className="font-bold text-slate-800">GEO 최적화 신호</h3>
            </div>
            <div className="space-y-2.5">
              {result.geoSignals.map((sig, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50">
                  <SignalIcon status={sig.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-700">{sig.label}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${sig.status === 'good' ? 'bg-emerald-100 text-emerald-700' : sig.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {sig.status === 'good' ? '양호' : sig.status === 'warning' ? '주의' : '누락'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{sig.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI recommendations */}
          {result.recommendations.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-100 rounded-xl"><Zap size={16} className="text-indigo-600" /></div>
                <h3 className="font-bold text-slate-800">GEO 가시성 개선 우선순위</h3>
              </div>
              <div className="space-y-3">
                {result.recommendations.map((r) => (
                  <div key={r.priority} className="flex gap-3 p-3 bg-indigo-50/50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                      {r.priority}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800 mb-0.5">{r.title}</div>
                      <div className="text-xs text-slate-600 leading-relaxed">{r.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Questions */}
          <Card>
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare size={16} className="text-slate-500" />
              <h3 className="font-bold text-slate-800">AI 검색 시뮬레이션 결과</h3>
              <span className="text-xs text-slate-400">({result.questions.length}개 질문)</span>
            </div>
            <div className="divide-y divide-slate-50">
              {result.questions.map((q, i) => (
                <div key={i} className="p-4">
                  <button
                    className="w-full text-left flex items-start gap-3 group"
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  >
                    {/* mention status icon */}
                    <div className="shrink-0 mt-0.5">
                      {q.isRecommended
                        ? <CheckCircle2 size={18} className="text-emerald-500" />
                        : q.isMentioned
                        ? <MinusCircle size={18} className="text-amber-500" />
                        : <XCircle size={18} className="text-rose-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">{q.question}</span>
                        <ToneChip tone={q.tone} />
                        {q.isRecommended && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">추천 포함</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{q.analysis}</p>
                    </div>
                    <div className="shrink-0 text-slate-300 group-hover:text-slate-500">
                      {openIdx === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {openIdx === i && (
                    <div className="mt-3 ml-7 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1.5">AI 검색 응답 전문</div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-3 text-[10px] text-slate-400">
                        <span>점수: <strong className="text-slate-700">{q.score}/20</strong></span>
                        <span>언급: <strong className={q.isMentioned ? 'text-emerald-600' : 'text-rose-500'}>{q.isMentioned ? '있음' : '없음'}</strong></span>
                        <span>추천: <strong className={q.isRecommended ? 'text-emerald-600' : 'text-slate-500'}>{q.isRecommended ? '있음' : '없음'}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
