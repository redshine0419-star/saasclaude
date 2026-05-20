'use client';

import { useState } from 'react';
import {
  Swords, Loader2, AlertCircle, Globe, Zap,
  CheckCircle2, XCircle, TrendingUp, TrendingDown,
  Minus, Lightbulb, BarChart2,
} from 'lucide-react';
import { useAppLang } from '@/components/AppLangContext';
import { t } from '@/lib/app-i18n';

interface GapTopic {
  topic: string;
  competitorHas: boolean;
  ourHas: boolean;
  importance: 'High' | 'Medium' | 'Low';
  reason: string;
}

interface ContentRecommendation {
  title: string;
  keyword: string;
  format: string;
  reason: string;
  estimatedImpact: 'High' | 'Medium' | 'Low';
}

interface CompetitorGapResult {
  ourUrl: string;
  competitorUrl: string;
  ourProfile: { origin: string; wordCount: number; h2Count: number; hasJsonLd: boolean };
  competitorProfile: { origin: string; wordCount: number; h2Count: number; hasJsonLd: boolean };
  gapScore: number;
  topics: GapTopic[];
  contentRecommendations: ContentRecommendation[];
  ourAdvantages: string[];
  summary: string;
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

function importanceBadge(imp: 'High' | 'Medium' | 'Low') {
  const map = {
    High:   'bg-rose-100 text-rose-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low:    'bg-slate-100 text-slate-600',
  };
  return map[imp];
}

function impactColor(imp: 'High' | 'Medium' | 'Low') {
  if (imp === 'High') return 'text-rose-600';
  if (imp === 'Medium') return 'text-amber-600';
  return 'text-slate-500';
}

function gapLabel(score: number) {
  if (score >= 70) return { label: '격차 큼', color: 'text-rose-600', ring: 'border-rose-500' };
  if (score >= 40) return { label: '격차 보통', color: 'text-amber-600', ring: 'border-amber-400' };
  return { label: '우위', color: 'text-emerald-600', ring: 'border-emerald-500' };
}

export default function CompetitorGapModule({ onToast }: { onToast: (msg: string) => void }) {
  const { lang } = useAppLang();
  const [ourUrl, setOurUrl] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CompetitorGapResult | null>(null);

  const run = async () => {
    if (!ourUrl.trim() || !competitorUrl.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/competitor-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ourUrl: ourUrl.trim(), competitorUrl: competitorUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `오류 (${res.status})`);
      setResult(data);
      onToast(`경쟁사 콘텐츠 갭 분석 완료 — 격차 점수 ${data.gapScore}점`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const topicsOnlyCompetitor = result?.topics.filter((t) => t.competitorHas && !t.ourHas) ?? [];
  const topicsOnlyOurs = result?.topics.filter((t) => !t.competitorHas && t.ourHas) ?? [];
  const topicsBoth = result?.topics.filter((t) => t.competitorHas && t.ourHas) ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Swords size={22} className="text-indigo-600" /> {t('compGap', 'title', lang)}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('compGap', 'subtitle', lang)}
        </p>
      </div>

      {/* Input */}
      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">
              {t('compGap', 'ourUrl', lang)} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={ourUrl}
                onChange={(e) => setOurUrl(e.target.value)}
                placeholder="https://oursite.com"
                className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">
              {t('compGap', 'competitorUrl', lang)} <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Swords size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                placeholder="https://competitor.com"
                className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                disabled={loading}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading || !ourUrl.trim() || !competitorUrl.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> {t('compGap', 'running', lang)}</>
              : <><Swords size={15} /> {t('compGap', 'runBtn', lang)}</>
            }
          </button>
          {loading && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" />{t('compGap', 'runningMsg', lang)}
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
          {/* Summary + Gap score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gap score ring */}
            <Card className="p-5 flex flex-col items-center justify-center text-center">
              {(() => {
                const g = gapLabel(result.gapScore);
                return (
                  <>
                    <div className={`w-20 h-20 rounded-full border-4 ${g.ring} flex items-center justify-center mb-3`}>
                      <span className={`text-2xl font-black ${g.color}`}>{result.gapScore}</span>
                    </div>
                    <div className="text-xs font-black text-slate-500">콘텐츠 갭 점수</div>
                    <div className={`text-sm font-bold mt-1 ${g.color}`}>{g.label}</div>
                    <div className="text-xs text-slate-400 mt-1">100에 가까울수록 격차 큼</div>
                  </>
                );
              })()}
            </Card>

            {/* Site comparison */}
            <Card className="p-5 col-span-2">
              <div className="text-xs font-black text-slate-400 uppercase mb-3">사이트 지표 비교</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {[
                  { label: '도메인', our: result.ourProfile.origin, comp: result.competitorProfile.origin, compare: false },
                  { label: '단어 수', our: result.ourProfile.wordCount.toLocaleString(), comp: result.competitorProfile.wordCount.toLocaleString(), ourNum: result.ourProfile.wordCount, compNum: result.competitorProfile.wordCount },
                  { label: 'H2 개수', our: String(result.ourProfile.h2Count), comp: String(result.competitorProfile.h2Count), ourNum: result.ourProfile.h2Count, compNum: result.competitorProfile.h2Count },
                  { label: '구조화 데이터', our: result.ourProfile.hasJsonLd ? '있음' : '없음', comp: result.competitorProfile.hasJsonLd ? '있음' : '없음', compare: false },
                ].map((row) => {
                  const ourBetter = row.ourNum !== undefined && row.compNum !== undefined && row.ourNum >= row.compNum;
                  const compBetter = row.ourNum !== undefined && row.compNum !== undefined && row.compNum > row.ourNum;
                  return (
                    <div key={row.label} className="contents">
                      <div className="text-xs text-slate-400 col-span-2 font-medium mt-1">{row.label}</div>
                      <div className="flex items-center gap-1 text-slate-700">
                        {ourBetter ? <TrendingUp size={12} className="text-emerald-500" /> : compBetter ? <TrendingDown size={12} className="text-rose-400" /> : <Minus size={12} className="text-slate-300" />}
                        <span className={ourBetter ? 'font-bold text-emerald-700' : compBetter ? 'text-rose-600' : ''}>{row.our}</span>
                        <span className="text-[10px] text-slate-400">(우리)</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-700">
                        {compBetter ? <TrendingUp size={12} className="text-rose-400" /> : ourBetter ? <TrendingDown size={12} className="text-slate-300" /> : <Minus size={12} className="text-slate-300" />}
                        <span className={compBetter ? 'font-bold text-rose-700' : ''}>{row.comp}</span>
                        <span className="text-[10px] text-slate-400">(경쟁사)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Summary */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={16} className="text-indigo-500" />
              <h3 className="font-bold text-slate-800">AI 분석 요약</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
          </Card>

          {/* Topics gap */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Competitor only — needs action */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={16} className="text-rose-400" />
                <h3 className="font-bold text-slate-800">경쟁사만 다루는 주제</h3>
                <span className="text-xs text-slate-400">({topicsOnlyCompetitor.length}개)</span>
              </div>
              {topicsOnlyCompetitor.length === 0
                ? <p className="text-xs text-slate-400">경쟁사 전용 주제가 없습니다.</p>
                : (
                  <div className="space-y-2">
                    {topicsOnlyCompetitor.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-rose-50 rounded-xl">
                        <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-black ${importanceBadge(t.importance)}`}>{t.importance}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{t.topic}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{t.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </Card>

            {/* Our advantages */}
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <h3 className="font-bold text-slate-800">우리만 다루는 주제</h3>
                  <span className="text-xs text-slate-400">({topicsOnlyOurs.length}개)</span>
                </div>
                {topicsOnlyOurs.length === 0
                  ? <p className="text-xs text-slate-400">차별화된 주제가 없습니다.</p>
                  : (
                    <div className="space-y-1.5">
                      {topicsOnlyOurs.map((t, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-emerald-50 rounded-xl">
                          <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-black ${importanceBadge(t.importance)}`}>{t.importance}</span>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{t.topic}</div>
                            <div className="text-xs text-slate-500">{t.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </Card>

              {result.ourAdvantages.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-emerald-500" />
                    <h3 className="font-bold text-slate-800">우리 강점</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {result.ourAdvantages.map((adv, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        {adv}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>

          {/* Both cover */}
          {topicsBoth.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Minus size={16} className="text-slate-400" />
                <h3 className="font-bold text-slate-800">공통 주제</h3>
                <span className="text-xs text-slate-400">({topicsBoth.length}개)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topicsBoth.map((t, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    {t.topic}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Content recommendations */}
          {result.contentRecommendations.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-100 rounded-xl"><Lightbulb size={16} className="text-indigo-600" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">콘텐츠 제작 추천</h3>
                  <p className="text-xs text-slate-500">갭 분석 기반 즉시 제작 가능한 콘텐츠 목록</p>
                </div>
              </div>
              <div className="space-y-3">
                {result.contentRecommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${rec.estimatedImpact === 'High' ? 'bg-rose-100 text-rose-700' : rec.estimatedImpact === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-800">{rec.title}</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">{rec.format}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-slate-400">키워드:</span>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{rec.keyword}</span>
                        <span className={`text-[10px] font-bold ${impactColor(rec.estimatedImpact)}`}>
                          기대 효과 {rec.estimatedImpact}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
