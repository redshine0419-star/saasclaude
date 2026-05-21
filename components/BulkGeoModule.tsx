'use client';

import { useState } from 'react';
import {
  Globe, Loader2, AlertCircle, Search, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertTriangle, Zap, FileSearch, BarChart2,
  ExternalLink,
} from 'lucide-react';
import { useAppLang } from '@/components/AppLangContext';
import { t, tExpand } from '@/lib/app-i18n';

interface PageScore {
  url: string;
  score: number;
  status: 'ok' | 'error' | 'timeout';
  title: string | null;
  h1: string | null;
  wordCount: number;
  issues: { title: string; impact: 'High' | 'Medium' | 'Low' }[];
  hasJsonLd: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  hasDescription: boolean;
}

interface BulkResult {
  siteUrl: string;
  sitemapUrl: string;
  totalUrls: number;
  analyzedUrls: number;
  avgScore: number;
  distribution: { good: number; warning: number; critical: number };
  topIssues: { title: string; count: number; impact: 'High' | 'Medium' | 'Low' }[];
  pages: PageScore[];
  aiRecommendations: { priority: number; title: string; detail: string }[];
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

function scoreColor(score: number) {
  if (score >= 70) return { text: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-500', labelKey: 'scoreGood' as const };
  if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-400', labelKey: 'scoreWarn' as const };
  return { text: 'text-rose-600', bg: 'bg-rose-100', bar: 'bg-rose-500', labelKey: 'scoreDanger' as const };
}

function impactBadge(impact: 'High' | 'Medium' | 'Low') {
  if (impact === 'High') return 'bg-rose-100 text-rose-700';
  if (impact === 'Medium') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

const shortUrl = (url: string) => {
  try {
    const u = new URL(url);
    return (u.pathname + u.search) || '/';
  } catch { return url; }
};

export default function BulkGeoModule({ onToast }: { onToast: (msg: string) => void }) {
  const { lang } = useAppLang();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BulkResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'url'>('score');

  const run = async () => {
    const siteUrl = input.trim();
    if (!siteUrl) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/bulk-geo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Use i18n key for sitemap-not-found, otherwise generic message
        if (data?.error === 'SITEMAP_NOT_FOUND') {
          throw new Error(t('bulkGeo', 'errorNoSitemap', lang));
        }
        throw new Error(data?.message || data?.error || t('bulkGeo', 'httpError', lang).replace('{status}', String(res.status)));
      }
      setResult(data);
      onToast(t('bulkGeo', 'toastDone', lang).replace('{n}', String(data.analyzedUrls)).replace('{score}', String(data.avgScore)));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('bulkGeo', 'genericError', lang));
    } finally {
      setLoading(false);
    }
  };

  const sortedPages = result
    ? [...result.pages].sort((a, b) =>
        sortBy === 'score' ? a.score - b.score : a.url.localeCompare(b.url)
      )
    : [];
  const displayPages = expanded ? sortedPages : sortedPages.slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <FileSearch size={22} className="text-indigo-600" /> {t('bulkGeo', 'title', lang)}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('bulkGeo', 'subtitle', lang)}
        </p>
      </div>

      {/* Input */}
      <Card className="p-5">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">
          {t('bulkGeo', 'inputLabel', lang)}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && run()}
              placeholder="https://example.com 또는 https://example.com/sitemap.xml"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              disabled={loading}
            />
          </div>
          <button
            onClick={run}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> {t('bulkGeo', 'running', lang)}</>
              : <><Zap size={15} /> {t('bulkGeo', 'runBtn', lang)}</>
            }
          </button>
        </div>
        {loading && (
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <Loader2 size={11} className="animate-spin" />
            {t('bulkGeo', 'scanningMsg', lang)}
          </p>
        )}
      </Card>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">{error}</p>
              <p className="text-xs text-amber-600 mt-1">
                {error === t('bulkGeo', 'errorNoSitemap', lang)
                  ? (lang === 'ko' ? 'sitemap.xml URL을 직접 입력해 보세요 (예: https://example.com/sitemap.xml).'
                   : lang === 'ja' ? 'サイトマップのURLを直接入力してみてください（例: https://example.com/sitemap.xml）。'
                   : 'Try entering the sitemap URL directly (e.g. https://example.com/sitemap.xml).')
                  : t('common', 'tryDifferentUrl', lang)}
              </p>
              <button onClick={run} className="mt-2 text-xs font-bold text-amber-700 underline hover:text-amber-900">
                {t('common', 'retry', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('bulkGeo', 'avgGeoScore', lang), value: result.avgScore + (lang === 'en' ? 'pts' : lang === 'ja' ? '点' : '점'), sub: t('bulkGeo', 'pagesCount', lang).replace('{n}', String(result.analyzedUrls)), color: scoreColor(result.avgScore).text },
              { label: t('bulkGeo', 'goodLabel', lang), value: result.distribution.good + (lang === 'en' ? '' : lang === 'ja' ? '件' : '개'), sub: t('bulkGeo', 'noFixNeeded', lang), color: 'text-emerald-600' },
              { label: t('bulkGeo', 'warnLabel', lang), value: result.distribution.warning + (lang === 'en' ? '' : lang === 'ja' ? '件' : '개'), sub: t('bulkGeo', 'partialFix', lang), color: 'text-amber-600' },
              { label: t('bulkGeo', 'dangerLabel', lang), value: result.distribution.critical + (lang === 'en' ? '' : lang === 'ja' ? '件' : '개'), sub: t('bulkGeo', 'urgentFix', lang), color: 'text-rose-600' },
            ].map((m) => (
              <Card key={m.label} className="p-4 text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{m.label}</div>
                <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
              </Card>
            ))}
          </div>

          {/* Score bar chart */}
          <Card className="p-5">
            <div className="text-xs font-black text-slate-400 uppercase mb-3">{t('bulkGeo', 'scoreDist', lang)}</div>
            <div className="flex items-end gap-1 h-24">
              {(() => {
                const buckets = Array(10).fill(0);
                result.pages.forEach((p) => {
                  const idx = Math.min(9, Math.floor(p.score / 10));
                  buckets[idx]++;
                });
                const max = Math.max(...buckets, 1);
                return buckets.map((cnt, i) => {
                  const score = i * 10 + 5;
                  const c = scoreColor(score);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[9px] text-slate-400">{cnt > 0 ? cnt : ''}</div>
                      <div
                        className={`w-full rounded-t-sm ${c.bar} opacity-80 transition-all`}
                        style={{ height: `${(cnt / max) * 64}px`, minHeight: cnt > 0 ? 4 : 0 }}
                      />
                      <div className="text-[9px] text-slate-400">{i * 10}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>

          {/* AI recommendations */}
          {result.aiRecommendations.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-100 rounded-xl"><Zap size={16} className="text-indigo-600" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">{t('bulkGeo', 'aiPriority', lang)}</h3>
                  <p className="text-xs text-slate-500">{t('bulkGeo', 'aiPrioritySub', lang)}</p>
                </div>
              </div>
              <div className="space-y-3">
                {result.aiRecommendations.map((r) => (
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

          {/* Top issues */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="font-bold text-slate-800">{t('bulkGeo', 'commonIssues', lang)}</h3>
            </div>
            <div className="space-y-2">
              {result.topIssues.map((issue, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black ${impactBadge(issue.impact)}`}>
                    {issue.impact}
                  </span>
                  <span className="text-sm text-slate-700 flex-1">{issue.title}</span>
                  <span className="text-xs text-slate-400 shrink-0">{t('bulkGeo', 'issuePages', lang).replace('{count}', String(issue.count)).replace('{total}', String(result.analyzedUrls))}</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    <div
                      className={`h-full rounded-full ${issue.impact === 'High' ? 'bg-rose-400' : issue.impact === 'Medium' ? 'bg-amber-400' : 'bg-slate-300'}`}
                      style={{ width: `${(issue.count / result.analyzedUrls) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Page list */}
          <Card>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-slate-500" />
                <h3 className="font-bold text-slate-800">{t('bulkGeo', 'pageScores', lang)}</h3>
                <span className="text-xs text-slate-400">({result.pages.length}{lang === 'en' ? '' : lang === 'ja' ? '件' : '개'})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">{t('bulkGeo', 'sortLabel', lang)}</span>
                <button onClick={() => setSortBy('score')}
                  className={`px-2 py-1 rounded-lg ${sortBy === 'score' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t('bulkGeo', 'sortByScore', lang)}
                </button>
                <button onClick={() => setSortBy('url')}
                  className={`px-2 py-1 rounded-lg ${sortBy === 'url' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t('bulkGeo', 'sortByUrl', lang)}
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {displayPages.map((page, i) => {
                const c = scoreColor(page.score);
                return (
                  <div key={i} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Score badge */}
                      <div className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${c.bg}`}>
                        <span className={`text-lg font-black leading-none ${c.text}`}>{page.score}</span>
                        <span className={`text-[9px] font-bold ${c.text}`}>{t('bulkGeo', c.labelKey, lang)}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* URL */}
                        <div className="flex items-center gap-2 mb-1">
                          {page.status !== 'ok'
                            ? <XCircle size={13} className="text-rose-400 shrink-0" />
                            : page.score >= 70
                            ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            : <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                          }
                          <a
                            href={page.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-slate-700 font-medium hover:text-indigo-600 truncate flex items-center gap-1"
                          >
                            {shortUrl(page.url)}
                            <ExternalLink size={11} className="shrink-0 opacity-40" />
                          </a>
                        </div>

                        {/* Title / H1 */}
                        {page.title && (
                          <div className="text-xs text-slate-500 truncate mb-1.5">{page.title}</div>
                        )}

                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {[
                            { label: 'JSON-LD', ok: page.hasJsonLd },
                            { label: 'OG', ok: page.hasOg },
                            { label: 'Description', ok: page.hasDescription },
                            { label: 'Canonical', ok: page.hasCanonical },
                          ].map((chip) => (
                            <span key={chip.label}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${chip.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400 line-through'}`}>
                              {chip.label}
                            </span>
                          ))}
                          {page.wordCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${page.wordCount >= 500 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {page.wordCount}{t('bulkGeo', 'wordUnit', lang)}
                            </span>
                          )}
                        </div>

                        {/* Issues */}
                        {page.issues.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {page.issues.slice(0, 3).map((issue, j) => (
                              <span key={j} className={`px-1.5 py-0.5 rounded text-[9px] ${impactBadge(issue.impact)}`}>
                                {issue.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Score bar */}
                      <div className="shrink-0 w-16 hidden sm:block">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${page.score}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {result.pages.length > 10 && (
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors py-1"
                >
                  {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {expanded ? t('common', 'collapse', lang) : tExpand(result.pages.length - 10, lang)}
                </button>
              </div>
            )}
          </Card>

          {/* Sitemap info */}
          <div className="text-xs text-slate-400 text-center">
            <Search size={11} className="inline mr-1" />
            {t('bulkGeo', 'sitemapInfo', lang)}<span className="font-mono">{result.sitemapUrl}</span>
            {' · '}{t('bulkGeo', 'urlsFound', lang).replace('{total}', String(result.totalUrls)).replace('{analyzed}', String(result.analyzedUrls))}
          </div>
        </>
      )}
    </div>
  );
}
