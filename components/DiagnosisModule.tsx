'use client';

import { useState } from 'react';
import {
  Globe, Loader2, Sparkles, Copy, CheckCircle2, AlertCircle,
  Smartphone, Monitor, ShieldCheck, FileText, Image,
  Link, Type, Share2, Code2, Bot, ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import { saveDiagnosis, getDiagnoses } from '@/lib/storage';
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
  meta: {
    title: string | null; titleLength: number;
    description: string | null; descriptionLength: number;
    viewport: string | null; lang: string | null; charset: string | null;
    author: string | null; articlePublished: string | null; articleModified: string | null;
    robotsMeta: string | null; isNoindex: boolean; canonical: string | null;
  };
  og: {
    title: string | null; description: string | null; image: string | null;
    type: string | null; url: string | null;
    twitterCard: string | null; twitterTitle: string | null;
    twitterDescription: string | null; twitterImage: string | null;
  };
  headings: { h1: string[]; h1Count: number; h2: string[]; h2Count: number; h3Count: number };
  content: { wordCount: number; internalLinks: number; externalLinks: number; nofollowLinks: number; isHttps: boolean; hasFavicon: boolean };
  images: { total: number; missingAlt: number };
  jsonLd: {
    exists: boolean; count: number; types: string[];
    hasFaq: boolean; hasArticle: boolean; hasBreadcrumb: boolean;
    hasProduct: boolean; hasOrganization: boolean; hasHowTo: boolean;
  };
  llmsTxt: { exists: boolean };
  robotsTxt: { exists: boolean; llmBlocked: boolean; hasSitemap: boolean };
  sitemap: { exists: boolean };
  score: number;
  issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
}

// ---- checklist section ----
function CheckSection({ title, icon, items, defaultOpen = true }: {
  title: string;
  icon: React.ReactNode;
  items: { label: string; ok: boolean; warn?: boolean; value: string }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const passed = items.filter((i) => i.ok).length;
  const total = items.length;
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-indigo-600">{icon}</span>
          <span className="font-bold text-sm text-slate-800">{title}</span>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${passed === total ? 'bg-emerald-100 text-emerald-700' : passed > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'}`}>
            {passed}/{total}
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
          {items.map((item) => (
            <div key={item.label} className={`flex items-start gap-2.5 p-3 rounded-xl ${item.ok ? 'bg-emerald-50' : item.warn ? 'bg-amber-50' : 'bg-rose-50'}`}>
              {item.ok
                ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                : item.warn
                  ? <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  : <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wide">{item.label}</div>
                <div className={`text-xs mt-0.5 font-semibold truncate ${item.ok ? 'text-emerald-700' : item.warn ? 'text-amber-700' : 'text-rose-700'}`}>
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

      const prevDiagnoses = getDiagnoses().filter((d) => d.url === url);
      const prev = prevDiagnoses[prevDiagnoses.length - 1];

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

      if (prev) {
        const newScores = { performance: aData.mobile.scores.performance, seo: aData.mobile.scores.seo, geo: gData.score };
        const alerts = ([
          { metric: 'Performance', previous: prev.scores.performance, current: newScores.performance },
          { metric: 'SEO', previous: prev.scores.seo, current: newScores.seo },
          { metric: 'GEO', previous: prev.scores.geo, current: newScores.geo },
        ] as const).map((a) => ({ ...a, url, delta: a.current - a.previous }))
          .filter((a) => Math.abs(a.delta) >= 10);

        if (alerts.length > 0) {
          fetch('/api/slack/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alerts, context: url }),
          }).catch(() => {});
        }
      }

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

  const downloadReport = () => {
    if (!analyzeData || !geoData) return;
    const date = new Date().toLocaleDateString('ko-KR');
    const m = analyzeData.mobile.scores;
    const d = analyzeData.desktop.scores;
    const geo = geoData;

    let md = '# SEO & GEO 진단 리포트\n\n';
    md += `**분석 URL:** ${url}\n`;
    md += `**분석일:** ${date}\n\n`;
    md += '---\n\n';

    md += '## 📊 성능 점수\n\n';
    md += '| 지표 | 모바일 | 데스크탑 |\n|---|---|---|\n';
    md += `| Performance | ${m.performance} | ${d.performance} |\n`;
    md += `| SEO | ${m.seo} | ${d.seo} |\n`;
    md += `| Accessibility | ${m.accessibility} | ${d.accessibility} |\n`;
    md += `| Best Practices | ${m.bestPractices ?? '-'} | ${d.bestPractices ?? '-'} |\n`;
    md += `| **GEO Visibility** | **${geo.score}/22** | — |\n\n`;

    md += '## 🌐 Core Web Vitals (모바일)\n\n';
    Object.entries(analyzeData.mobile.vitals).forEach(([k, v]) => {
      md += `- **${k.toUpperCase()}**: ${v}\n`;
    });
    md += '\n';

    md += '## ✅ SEO & GEO 체크리스트\n\n';
    md += `### 타이틀 & 메타\n`;
    md += `- 타이틀: ${geo.meta.title || '없음'} (${geo.meta.titleLength}자)\n`;
    md += `- 메타 설명: ${geo.meta.description ? geo.meta.description.slice(0, 80) + '…' : '없음'} (${geo.meta.descriptionLength}자)\n`;
    md += `- Viewport: ${geo.meta.viewport ? '있음' : '없음'}\n`;
    md += `- 언어 속성(lang): ${geo.meta.lang || '없음'}\n`;
    md += `- Canonical: ${geo.meta.canonical || '없음'}\n`;
    md += `- Noindex: ${geo.meta.isNoindex ? '⚠️ 있음' : '없음'}\n\n`;

    md += `### Open Graph & SNS\n`;
    md += `- og:title: ${geo.og.title ? '있음' : '없음'}\n`;
    md += `- og:description: ${geo.og.description ? '있음' : '없음'}\n`;
    md += `- og:image: ${geo.og.image ? '있음' : '없음'}\n`;
    md += `- twitter:card: ${geo.og.twitterCard || '없음'}\n\n`;

    md += `### 콘텐츠 구조\n`;
    md += `- H1: ${geo.headings.h1Count}개 / H2: ${geo.headings.h2Count}개 / H3: ${geo.headings.h3Count}개\n`;
    md += `- 단어 수: ${geo.content.wordCount.toLocaleString()}자\n`;
    md += `- 내부 링크: ${geo.content.internalLinks}개 / 외부 링크: ${geo.content.externalLinks}개\n`;
    md += `- 이미지 alt 누락: ${geo.images.missingAlt}/${geo.images.total}개\n`;
    md += `- HTTPS: ${geo.content.isHttps ? '✅' : '❌'}\n\n`;

    md += `### 구조화 데이터 (JSON-LD)\n`;
    md += `- JSON-LD: ${geo.jsonLd.exists ? '있음 (' + geo.jsonLd.types.join(', ') + ')' : '없음'}\n`;
    md += `- FAQ: ${geo.jsonLd.hasFaq ? '✅' : '❌'} | Article: ${geo.jsonLd.hasArticle ? '✅' : '❌'} | Organization: ${geo.jsonLd.hasOrganization ? '✅' : '❌'}\n\n`;

    md += `### 기술 SEO & GEO\n`;
    md += `- Sitemap: ${geo.sitemap.exists ? '✅' : '❌'}\n`;
    md += `- robots.txt: ${geo.robotsTxt.exists ? '✅' : '❌'}\n`;
    md += `- AI 봇 차단: ${geo.robotsTxt.llmBlocked ? '⚠️ 차단됨' : '허용'}\n`;
    md += `- llms.txt: ${geo.llmsTxt.exists ? '✅' : '❌'}\n\n`;

    if (geo.issues.length > 0) {
      md += '## ⚠️ 주요 개선 이슈\n\n';
      geo.issues.forEach(issue => {
        const icon = issue.impact === 'High' ? '🔴' : issue.impact === 'Medium' ? '🟡' : '🟢';
        md += `### ${icon} [${issue.impact}] ${issue.title}\n${issue.detail}\n\n`;
      });
    }

    if (advice) {
      md += '---\n\n## 🤖 AI 시니어 마케터 어드바이저\n\n' + advice + '\n';
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'seo-geo-report-' + new Date().toISOString().slice(0, 10) + '.md';
    link.click();
    URL.revokeObjectURL(link.href);
  };

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
          {/* Strategy Toggle + Download */}
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
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
              title="Markdown 리포트 다운로드"
            >
              <Download size={16} />
              리포트
            </button>
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

          {/* SEO & GEO Checklist */}
          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-600" />
              SEO & GEO 체크리스트
              <span className="ml-auto text-xs text-slate-400 font-normal">
                {[
                  geoData.meta.title, geoData.meta.description, geoData.meta.viewport,
                  geoData.meta.lang, geoData.meta.canonical, !geoData.meta.isNoindex,
                  geoData.og.title, geoData.og.description, geoData.og.image, geoData.og.twitterCard,
                  geoData.headings.h1Count === 1, geoData.headings.h2Count > 0,
                  geoData.content.wordCount >= 300, geoData.content.internalLinks > 0,
                  geoData.content.isHttps, geoData.content.hasFavicon, geoData.images.missingAlt === 0,
                  geoData.jsonLd.exists, geoData.llmsTxt.exists, !geoData.robotsTxt.llmBlocked,
                  geoData.sitemap.exists, geoData.meta.charset,
                ].filter(Boolean).length} / 22 통과
              </span>
            </h4>
            <div className="space-y-3">
              {/* 타이틀 & 메타 */}
              <CheckSection
                title="타이틀 & 메타"
                icon={<Type size={16} />}
                items={[
                  {
                    label: 'Title 태그',
                    ok: !!geoData.meta.title && geoData.meta.titleLength >= 10 && geoData.meta.titleLength <= 60,
                    warn: !!geoData.meta.title && (geoData.meta.titleLength < 10 || geoData.meta.titleLength > 60),
                    value: geoData.meta.title
                      ? `"${geoData.meta.title.slice(0, 45)}${geoData.meta.title.length > 45 ? '…' : ''}" (${geoData.meta.titleLength}자)`
                      : 'Title 태그 없음',
                  },
                  {
                    label: 'Meta Description',
                    ok: !!geoData.meta.description && geoData.meta.descriptionLength >= 70 && geoData.meta.descriptionLength <= 160,
                    warn: !!geoData.meta.description && (geoData.meta.descriptionLength < 70 || geoData.meta.descriptionLength > 160),
                    value: geoData.meta.description
                      ? `${geoData.meta.descriptionLength}자 ${geoData.meta.descriptionLength < 70 ? '(짧음)' : geoData.meta.descriptionLength > 160 ? '(김)' : '(최적)'}`
                      : 'Meta Description 없음',
                  },
                  {
                    label: 'Viewport (모바일)',
                    ok: !!geoData.meta.viewport,
                    warn: false,
                    value: geoData.meta.viewport ?? 'Viewport 태그 없음 — 모바일 순위 하락',
                  },
                  {
                    label: 'HTML lang 속성',
                    ok: !!geoData.meta.lang,
                    warn: false,
                    value: geoData.meta.lang ? `lang="${geoData.meta.lang}"` : 'lang 속성 없음',
                  },
                  {
                    label: 'Charset 인코딩',
                    ok: !!geoData.meta.charset,
                    warn: false,
                    value: geoData.meta.charset ?? 'Charset 선언 없음',
                  },
                  {
                    label: 'Robots 메타',
                    ok: !geoData.meta.isNoindex,
                    warn: false,
                    value: geoData.meta.isNoindex ? '⚠ noindex 감지 — 검색 색인 차단됨' : geoData.meta.robotsMeta ?? '설정 없음 (기본 색인)',
                  },
                  {
                    label: 'Canonical URL',
                    ok: !!geoData.meta.canonical,
                    warn: false,
                    value: geoData.meta.canonical ? geoData.meta.canonical.slice(0, 50) + (geoData.meta.canonical.length > 50 ? '…' : '') : 'Canonical 태그 없음',
                  },
                  {
                    label: '게시/수정일',
                    ok: !!geoData.meta.articleModified || !!geoData.meta.articlePublished,
                    warn: false,
                    value: geoData.meta.articleModified
                      ? '수정일: ' + geoData.meta.articleModified.slice(0, 10)
                      : geoData.meta.articlePublished
                        ? '게시일: ' + geoData.meta.articlePublished.slice(0, 10)
                        : '날짜 메타 없음 (콘텐츠 신선도 불명확)',
                  },
                  {
                    label: 'Author 정보',
                    ok: !!geoData.meta.author,
                    warn: false,
                    value: geoData.meta.author ?? 'Author 메타 없음 (E-E-A-T 약화)',
                  },
                ]}
              />

              {/* OG & SNS */}
              <CheckSection
                title="Open Graph & SNS"
                icon={<Share2 size={16} />}
                defaultOpen={false}
                items={[
                  { label: 'og:title', ok: !!geoData.og.title, warn: false, value: geoData.og.title ?? 'og:title 없음' },
                  { label: 'og:description', ok: !!geoData.og.description, warn: false, value: geoData.og.description ? geoData.og.description.slice(0, 50) + '…' : 'og:description 없음' },
                  { label: 'og:image', ok: !!geoData.og.image, warn: false, value: geoData.og.image ? '이미지 설정됨' : 'og:image 없음 — SNS 공유 시 이미지 미표시' },
                  { label: 'og:type', ok: !!geoData.og.type, warn: false, value: geoData.og.type ?? 'og:type 없음' },
                  { label: 'Twitter Card', ok: !!geoData.og.twitterCard, warn: false, value: geoData.og.twitterCard ?? 'twitter:card 없음' },
                  { label: 'Twitter Image', ok: !!geoData.og.twitterImage, warn: false, value: geoData.og.twitterImage ? '이미지 설정됨' : 'twitter:image 없음' },
                ]}
              />

              {/* 콘텐츠 구조 */}
              <CheckSection
                title="콘텐츠 구조"
                icon={<FileText size={16} />}
                defaultOpen={false}
                items={[
                  {
                    label: 'H1 태그',
                    ok: geoData.headings.h1Count === 1,
                    warn: geoData.headings.h1Count > 1,
                    value: geoData.headings.h1Count === 0
                      ? 'H1 없음 — 핵심 키워드 누락'
                      : geoData.headings.h1Count === 1
                        ? `"${(geoData.headings.h1[0] ?? '').slice(0, 40)}"`
                        : `H1 ${geoData.headings.h1Count}개 중복 — 1개만 허용`,
                  },
                  {
                    label: 'H2 구조',
                    ok: geoData.headings.h2Count > 0,
                    warn: false,
                    value: geoData.headings.h2Count > 0 ? `H2 ${geoData.headings.h2Count}개, H3 ${geoData.headings.h3Count}개` : 'H2 소제목 없음 — 콘텐츠 구조 취약',
                  },
                  {
                    label: '콘텐츠 분량',
                    ok: geoData.content.wordCount >= 300,
                    warn: geoData.content.wordCount >= 300 && geoData.content.wordCount < 1000,
                    value: `약 ${geoData.content.wordCount.toLocaleString()}단어 ${geoData.content.wordCount < 300 ? '(너무 짧음)' : geoData.content.wordCount < 1000 ? '(보통)' : '(양호)'}`,
                  },
                  {
                    label: '내부 링크',
                    ok: geoData.content.internalLinks >= 3,
                    warn: geoData.content.internalLinks > 0 && geoData.content.internalLinks < 3,
                    value: `${geoData.content.internalLinks}개 ${geoData.content.internalLinks === 0 ? '(없음)' : geoData.content.internalLinks < 3 ? '(3개 이상 권장)' : '(양호)'}`,
                  },
                  {
                    label: '외부 링크',
                    ok: geoData.content.externalLinks > 0,
                    warn: false,
                    value: `${geoData.content.externalLinks}개 ${geoData.content.externalLinks === 0 ? '(신뢰 신호 약함)' : '(신뢰 도메인 연결)'}`,
                  },
                  {
                    label: '이미지 Alt',
                    ok: geoData.images.missingAlt === 0,
                    warn: false,
                    value: geoData.images.missingAlt === 0
                      ? `전체 ${geoData.images.total}개 Alt 완비`
                      : `${geoData.images.missingAlt}/${geoData.images.total}개 Alt 누락`,
                  },
                  {
                    label: 'Favicon',
                    ok: geoData.content.hasFavicon,
                    warn: false,
                    value: geoData.content.hasFavicon ? '파비콘 설정됨' : '파비콘 없음',
                  },
                ]}
              />

              {/* 구조화 데이터 */}
              <CheckSection
                title="구조화 데이터 (Schema.org)"
                icon={<Code2 size={16} />}
                defaultOpen={false}
                items={[
                  {
                    label: 'JSON-LD 존재',
                    ok: geoData.jsonLd.exists,
                    warn: false,
                    value: geoData.jsonLd.exists ? `${geoData.jsonLd.count}개 — ${geoData.jsonLd.types.join(', ')}` : 'JSON-LD 없음 — 리치 스니펫 불가',
                  },
                  { label: 'Article / BlogPosting', ok: geoData.jsonLd.hasArticle, warn: false, value: geoData.jsonLd.hasArticle ? '설정됨' : '없음 (블로그/뉴스에 필수)' },
                  { label: 'FAQPage', ok: geoData.jsonLd.hasFaq, warn: false, value: geoData.jsonLd.hasFaq ? '설정됨' : '없음 (Q&A 직접 노출 불가)' },
                  { label: 'BreadcrumbList', ok: geoData.jsonLd.hasBreadcrumb, warn: false, value: geoData.jsonLd.hasBreadcrumb ? '설정됨' : '없음 (URL 경로 표시 불가)' },
                  { label: 'Organization', ok: geoData.jsonLd.hasOrganization, warn: false, value: geoData.jsonLd.hasOrganization ? '설정됨' : '없음 (브랜드 신뢰도 약화)' },
                  { label: 'HowTo', ok: geoData.jsonLd.hasHowTo, warn: false, value: geoData.jsonLd.hasHowTo ? '설정됨' : '없음 (해당 시 추가 권장)' },
                ]}
              />

              {/* 기술 SEO & GEO */}
              <CheckSection
                title="기술 SEO & GEO (AI 가시성)"
                icon={<Bot size={16} />}
                items={[
                  { label: 'HTTPS', ok: geoData.content.isHttps, warn: false, value: geoData.content.isHttps ? 'HTTPS 적용됨' : '⚠ HTTP — 보안 경고 및 순위 하락' },
                  {
                    label: 'XML Sitemap',
                    ok: geoData.sitemap.exists || geoData.robotsTxt.hasSitemap,
                    warn: false,
                    value: geoData.sitemap.exists ? '/sitemap.xml 존재' : geoData.robotsTxt.hasSitemap ? 'robots.txt에 Sitemap 선언됨' : 'Sitemap 없음 — 색인 속도 저하',
                  },
                  { label: 'robots.txt', ok: geoData.robotsTxt.exists, warn: false, value: geoData.robotsTxt.exists ? '존재' : 'robots.txt 없음' },
                  { label: 'AI 봇 정책', ok: !geoData.robotsTxt.llmBlocked, warn: false, value: geoData.robotsTxt.llmBlocked ? 'GPTBot/ClaudeBot 차단됨' : 'AI 봇 크롤링 허용' },
                  { label: 'llms.txt (GEO)', ok: geoData.llmsTxt.exists, warn: false, value: geoData.llmsTxt.exists ? 'llms.txt 존재' : 'llms.txt 없음 — GEO 노출 저하' },
                ]}
              />
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
