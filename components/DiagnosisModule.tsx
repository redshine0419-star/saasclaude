'use client';

import { useState } from 'react';
import {
  Globe, Loader2, Sparkles, Copy, CheckCircle2, AlertCircle,
  Smartphone, Monitor, ShieldCheck, FileText, Image,
  Link, Type, Share2, Code2, Bot, ChevronDown, ChevronUp, Download,
  Lock, Mail, Star, BarChart2,
} from 'lucide-react';
import { saveDiagnosis, getDiagnoses } from '@/lib/storage';
import AdUnit from '@/components/AdUnit';
import { useAppLang } from '@/components/AppLangContext';
import { t } from '@/lib/app-i18n';

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

interface RichResultCheck { eligible: boolean; missingFields: string[] }

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
  richResults: {
    article: RichResultCheck;
    product: RichResultCheck;
    faq: RichResultCheck;
    breadcrumb: RichResultCheck;
    organization: RichResultCheck;
  };
  contentQuality: {
    score: number;
    hasAuthorityLinks: boolean;
    hasFaqSection: boolean;
    keywordInBody: boolean;
    h2Density: number;
    avgSentenceLength: number;
  };
  llmsTxt: { exists: boolean };
  robotsTxt: { exists: boolean; llmBlocked: boolean; hasSitemap: boolean };
  sitemap: { exists: boolean };
  score: number;
  issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
}

interface SecurityResult {
  grade: string;
  score: number;
  headers: {
    hsts: { present: boolean; value: string | null; note: string };
    csp: { present: boolean; value: string | null; note: string };
    xFrameOptions: { present: boolean; value: string | null; note: string };
    xContentTypeOptions: { present: boolean; value: string | null; note: string };
    referrerPolicy: { present: boolean; value: string | null; note: string };
    permissionsPolicy: { present: boolean; value: string | null; note: string };
  };
  issues: { title: string; detail: string; impact: 'High' | 'Medium' | 'Low' }[];
}

interface EmailHealthResult {
  domain: string;
  grade: string;
  score: number;
  spf: { exists: boolean; valid: boolean; value: string | null };
  dkim: { exists: boolean; value: string | null };
  dmarc: { exists: boolean; policy: string | null; value: string | null };
  mx: { exists: boolean; records: string[] };
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

// ---- grade color helper ----
function gradeColor(grade: string) {
  if (grade === 'A+' || grade === 'A') return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' };
  if (grade === 'B') return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
  if (grade === 'C') return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' };
  return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' };
}

// ---- main component ----
export default function DiagnosisModule({ onToast }: { onToast: (msg: string) => void }) {
  const { lang } = useAppLang();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [step, setStep] = useState('');
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResult | null>(null);
  const [geoData, setGeoData] = useState<GeoResult | null>(null);
  const [securityData, setSecurityData] = useState<SecurityResult | null>(null);
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  // 이메일 진단 별도 상태
  const [emailDomain, setEmailDomain] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailData, setEmailData] = useState<EmailHealthResult | null>(null);
  const [emailError, setEmailError] = useState('');

  const runEmailCheck = async () => {
    if (!emailDomain.trim()) return;
    setEmailLoading(true);
    setEmailError('');
    setEmailData(null);
    try {
      const res = await fetch('/api/email-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: emailDomain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '이메일 진단 오류');
      setEmailData(data);
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setEmailLoading(false);
    }
  };

  const startAnalysis = async () => {
    if (!url.trim()) return;
    setStatus('scanning');
    setError('');
    setAnalyzeData(null);
    setGeoData(null);
    setSecurityData(null);
    setAdvice(null);

    try {
      setStep(t('diagnosis', 'analyzing1', lang));
      const [analyzeRes, geoRes, secRes] = await Promise.all([
        fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }),
        fetch('/api/geo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }),
        fetch('/api/security', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }),
      ]);

      if (!analyzeRes.ok) {
        const e = await analyzeRes.json();
        throw new Error(e.error ?? (lang === 'ko' ? 'PageSpeed API 오류' : lang === 'ja' ? 'PageSpeed API エラー' : 'PageSpeed API error'));
      }
      if (!geoRes.ok) {
        const e = await geoRes.json();
        throw new Error(e.error ?? (lang === 'ko' ? 'GEO 분석 오류' : lang === 'ja' ? 'GEO分析エラー' : 'GEO analysis error'));
      }

      setStep(t('diagnosis', 'analyzing2', lang));
      const [aData, gData, sData] = await Promise.all([analyzeRes.json(), geoRes.json(), secRes.ok ? secRes.json() : Promise.resolve(null)]);
      setAnalyzeData(aData);
      setGeoData(gData);
      setSecurityData(sData);
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
      setError(e instanceof Error ? e.message : (lang === 'ko' ? '알 수 없는 오류' : lang === 'ja' ? '不明なエラー' : 'Unknown error'));
      setStatus('error');
    }
  };

  const current = analyzeData?.[strategy];

  const impactVariant = (impact: string) =>
    impact === 'High' ? 'danger' : impact === 'Medium' ? 'warning' : 'default';

  const downloadReport = () => {
    if (!analyzeData || !geoData) return;
    const dateLocale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
    const date = new Date().toLocaleDateString(dateLocale);
    const m = analyzeData.mobile.scores;
    const d = analyzeData.desktop.scores;
    const geo = geoData;

    const reportTitle = t('diagnosis', 'reportTitle', lang);
    const urlLabel = lang === 'ko' ? '분석 URL' : lang === 'ja' ? '分析URL' : 'Analyzed URL';
    const dateLabel = lang === 'ko' ? '분석일' : lang === 'ja' ? '分析日' : 'Date';
    const yesLabel = lang === 'ko' ? '있음' : lang === 'ja' ? 'あり' : 'Yes';
    const noLabel = lang === 'ko' ? '없음' : lang === 'ja' ? 'なし' : 'No';
    const allowedLabel = lang === 'ko' ? '허용' : lang === 'ja' ? '許可' : 'Allowed';
    const blockedLabel = lang === 'ko' ? '⚠️ 차단됨' : lang === 'ja' ? '⚠️ ブロック済み' : '⚠️ Blocked';
    const mobileLabel = t('common', 'mobileStrategy', lang);
    const desktopLabel = t('common', 'desktopStrategy', lang);
    const checklistLabel = lang === 'ko' ? 'SEO & GEO 체크리스트' : lang === 'ja' ? 'SEO & GEO チェックリスト' : 'SEO & GEO Checklist';
    const titleMetaLabel = t('diagnosis', 'titleMeta', lang);
    const contentStructLabel = t('diagnosis', 'contentStruct', lang);
    const schemaLabel = t('diagnosis', 'schema', lang);
    const techSeoLabel = t('diagnosis', 'techSeo', lang);
    const issuesLabel = lang === 'ko' ? '주요 개선 이슈' : lang === 'ja' ? '主な改善課題' : 'Key Issues';
    const aiAdviceLabel = t('diagnosis', 'aiAdvice', lang);

    let md = `# ${reportTitle}\n\n`;
    md += `**${urlLabel}:** ${url}\n`;
    md += `**${dateLabel}:** ${date}\n\n`;
    md += '---\n\n';

    md += `## 📊 ${lang === 'ko' ? '성능 점수' : lang === 'ja' ? 'パフォーマンススコア' : 'Performance Scores'}\n\n`;
    md += `| ${lang === 'ko' ? '지표' : lang === 'ja' ? '指標' : 'Metric'} | ${mobileLabel} | ${desktopLabel} |\n|---|---|---|\n`;
    md += `| Performance | ${m.performance} | ${d.performance} |\n`;
    md += `| SEO | ${m.seo} | ${d.seo} |\n`;
    md += `| Accessibility | ${m.accessibility} | ${d.accessibility} |\n`;
    md += `| Best Practices | ${m.bestPractices ?? '-'} | ${d.bestPractices ?? '-'} |\n`;
    md += `| **GEO Visibility** | **${geo.score}/22** | — |\n\n`;

    md += `## 🌐 Core Web Vitals (${mobileLabel})\n\n`;
    Object.entries(analyzeData.mobile.vitals).forEach(([k, v]) => {
      md += `- **${k.toUpperCase()}**: ${v}\n`;
    });
    md += '\n';

    md += `## ✅ ${checklistLabel}\n\n`;
    md += `### ${titleMetaLabel}\n`;
    md += `- ${lang === 'ko' ? '타이틀' : lang === 'ja' ? 'タイトル' : 'Title'}: ${geo.meta.title || noLabel} (${geo.meta.titleLength}${lang === 'ko' ? '자' : lang === 'ja' ? '字' : ' chars'})\n`;
    md += `- ${lang === 'ko' ? '메타 설명' : lang === 'ja' ? 'メタ説明' : 'Meta Description'}: ${geo.meta.description ? geo.meta.description.slice(0, 80) + '…' : noLabel} (${geo.meta.descriptionLength}${lang === 'ko' ? '자' : lang === 'ja' ? '字' : ' chars'})\n`;
    md += `- Viewport: ${geo.meta.viewport ? yesLabel : noLabel}\n`;
    md += `- ${lang === 'ko' ? '언어 속성(lang)' : lang === 'ja' ? '言語属性(lang)' : 'Language attr (lang)'}: ${geo.meta.lang || noLabel}\n`;
    md += `- Canonical: ${geo.meta.canonical || noLabel}\n`;
    md += `- Noindex: ${geo.meta.isNoindex ? (lang === 'ko' ? '⚠️ 있음' : lang === 'ja' ? '⚠️ あり' : '⚠️ Yes') : noLabel}\n\n`;

    md += `### Open Graph & SNS\n`;
    md += `- og:title: ${geo.og.title ? yesLabel : noLabel}\n`;
    md += `- og:description: ${geo.og.description ? yesLabel : noLabel}\n`;
    md += `- og:image: ${geo.og.image ? yesLabel : noLabel}\n`;
    md += `- twitter:card: ${geo.og.twitterCard || noLabel}\n\n`;

    md += `### ${contentStructLabel}\n`;
    md += `- H1: ${geo.headings.h1Count} / H2: ${geo.headings.h2Count} / H3: ${geo.headings.h3Count}\n`;
    md += `- ${lang === 'ko' ? '단어 수' : lang === 'ja' ? '単語数' : 'Word count'}: ${geo.content.wordCount.toLocaleString()}\n`;
    md += `- ${lang === 'ko' ? '내부 링크' : lang === 'ja' ? '内部リンク' : 'Internal links'}: ${geo.content.internalLinks} / ${lang === 'ko' ? '외부 링크' : lang === 'ja' ? '外部リンク' : 'External links'}: ${geo.content.externalLinks}\n`;
    md += `- ${lang === 'ko' ? '이미지 alt 누락' : lang === 'ja' ? '画像 alt 未設定' : 'Missing image alt'}: ${geo.images.missingAlt}/${geo.images.total}\n`;
    md += `- HTTPS: ${geo.content.isHttps ? '✅' : '❌'}\n\n`;

    md += `### ${schemaLabel}\n`;
    md += `- JSON-LD: ${geo.jsonLd.exists ? yesLabel + ' (' + geo.jsonLd.types.join(', ') + ')' : noLabel}\n`;
    md += `- FAQ: ${geo.jsonLd.hasFaq ? '✅' : '❌'} | Article: ${geo.jsonLd.hasArticle ? '✅' : '❌'} | Organization: ${geo.jsonLd.hasOrganization ? '✅' : '❌'}\n\n`;

    md += `### ${techSeoLabel}\n`;
    md += `- Sitemap: ${geo.sitemap.exists ? '✅' : '❌'}\n`;
    md += `- robots.txt: ${geo.robotsTxt.exists ? '✅' : '❌'}\n`;
    md += `- ${lang === 'ko' ? 'AI 봇 차단' : lang === 'ja' ? 'AIボット設定' : 'AI Bot Policy'}: ${geo.robotsTxt.llmBlocked ? blockedLabel : allowedLabel}\n`;
    md += `- llms.txt: ${geo.llmsTxt.exists ? '✅' : '❌'}\n\n`;

    if (geo.issues.length > 0) {
      md += `## ⚠️ ${issuesLabel}\n\n`;
      geo.issues.forEach(issue => {
        const icon = issue.impact === 'High' ? '🔴' : issue.impact === 'Medium' ? '🟡' : '🟢';
        md += `### ${icon} [${issue.impact}] ${issue.title}\n${issue.detail}\n\n`;
      });
    }

    if (advice) {
      md += `---\n\n## 🤖 ${aiAdviceLabel}\n\n` + advice + '\n';
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
            <h3 className="text-xl font-bold text-slate-800">{t('diagnosis', 'title', lang)}</h3>
            <p className="text-sm text-slate-500">{t('diagnosis', 'subtitle', lang)}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="url"
              placeholder={t('diagnosis', 'urlPlaceholder', lang)}
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
            ) : t('diagnosis', 'startButton', lang)}
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
                {s === 'mobile' ? t('common', 'mobileStrategy', lang) : t('common', 'desktopStrategy', lang)}
              </button>
            ))}
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
              title={lang === 'ko' ? 'Markdown 리포트 다운로드' : lang === 'ja' ? 'Markdownレポートをダウンロード' : 'Download Markdown report'}
            >
              <Download size={16} />
              {t('diagnosis', 'reportBtn', lang)}
            </button>
          </div>

          {/* Score Rings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreRing score={current!.scores.performance} label="Performance" sub={t('diagnosis', 'coreWebVitals', lang)} />
            <ScoreRing score={current!.scores.seo} label="SEO" sub={t('diagnosis', 'seoScore', lang)} />
            <ScoreRing score={current!.scores.accessibility} label="Accessibility" sub={t('diagnosis', 'accessScore', lang)} />
            <ScoreRing score={geoData.score} label="GEO Visibility" sub={t('diagnosis', 'geoScore', lang)} />
          </div>

          {/* 보안 헤더 + 콘텐츠 품질 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityData && (() => {
              const gc = gradeColor(securityData.grade);
              const headerEntries = [
                { key: 'HSTS', h: securityData.headers.hsts },
                { key: 'CSP', h: securityData.headers.csp },
                { key: 'X-Frame-Options', h: securityData.headers.xFrameOptions },
                { key: 'X-Content-Type', h: securityData.headers.xContentTypeOptions },
                { key: 'Referrer-Policy', h: securityData.headers.referrerPolicy },
                { key: 'Permissions-Policy', h: securityData.headers.permissionsPolicy },
              ];
              return (
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock size={18} className="text-indigo-600" />
                    <h4 className="font-bold text-slate-800 text-sm">{lang === 'ko' ? '보안 헤더 진단' : lang === 'ja' ? 'セキュリティヘッダー診断' : 'Security Headers'}</h4>
                    <span className={`ml-auto text-lg font-black px-3 py-1 rounded-xl border ${gc.bg} ${gc.text} ${gc.border}`}>{securityData.grade}</span>
                  </div>
                  <div className="space-y-1.5">
                    {headerEntries.map(({ key, h }) => (
                      <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${h.present ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        <div className="flex items-center gap-2">
                          {h.present
                            ? <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            : <AlertCircle size={13} className="text-rose-500 shrink-0" />}
                          <span className="font-bold text-slate-700">{key}</span>
                        </div>
                        <span className={`text-[10px] max-w-[140px] truncate ${h.present ? 'text-emerald-700' : 'text-rose-600'}`}>{h.note}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${securityData.score >= 80 ? 'bg-emerald-500' : securityData.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${securityData.score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{securityData.score}/100</span>
                  </div>
                </Card>
              );
            })()}

            {geoData.contentQuality && (() => {
              const cq = geoData.contentQuality;
              const cqItems = [
                { label: lang === 'ko' ? '키워드 본문 노출' : 'Keyword in Body', ok: cq.keywordInBody, note: cq.keywordInBody ? (lang === 'ko' ? 'H1 키워드가 본문에 3회 이상 등장' : 'H1 keyword appears 3+ times') : (lang === 'ko' ? 'H1 키워드가 본문에 부족 — 토픽 일관성 약함' : 'H1 keyword insufficient in body') },
                { label: lang === 'ko' ? '권위 링크' : 'Authority Links', ok: cq.hasAuthorityLinks, note: cq.hasAuthorityLinks ? (lang === 'ko' ? '위키/정부/학술 링크 포함' : 'Wikipedia/gov/edu links present') : (lang === 'ko' ? '권위 있는 외부 링크 없음 — E-E-A-T 약화' : 'No authority links — weak E-E-A-T') },
                { label: 'FAQ 섹션', ok: cq.hasFaqSection, note: cq.hasFaqSection ? (lang === 'ko' ? 'FAQ 구조 감지됨' : 'FAQ structure detected') : (lang === 'ko' ? 'FAQ 없음 — AI 검색 노출 기회 손실' : 'No FAQ — lost AI search opportunity') },
                { label: lang === 'ko' ? 'H2 구조 밀도' : 'H2 Density', ok: cq.h2Density >= 1, note: lang === 'ko' ? `${cq.h2Density}/1000단어 ${cq.h2Density < 1 ? '(소제목 부족)' : '(양호)'}` : `${cq.h2Density}/1000 words ${cq.h2Density < 1 ? '(low)' : '(good)'}` },
              ];
              const cqGrade = cq.score >= 80 ? 'A' : cq.score >= 60 ? 'B' : cq.score >= 40 ? 'C' : 'D';
              const gc2 = gradeColor(cqGrade);
              return (
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart2 size={18} className="text-indigo-600" />
                    <h4 className="font-bold text-slate-800 text-sm">{lang === 'ko' ? '콘텐츠 품질 점수' : lang === 'ja' ? 'コンテンツ品質スコア' : 'Content Quality'}</h4>
                    <span className={`ml-auto text-lg font-black px-3 py-1 rounded-xl border ${gc2.bg} ${gc2.text} ${gc2.border}`}>{cq.score}</span>
                  </div>
                  <div className="space-y-1.5">
                    {cqItems.map(({ label, ok, note }) => (
                      <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${ok ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        <div className="flex items-center gap-2">
                          {ok ? <CheckCircle2 size={13} className="text-emerald-600 shrink-0" /> : <AlertCircle size={13} className="text-rose-500 shrink-0" />}
                          <span className="font-bold text-slate-700">{label}</span>
                        </div>
                        <span className={`text-[10px] max-w-[150px] truncate ${ok ? 'text-emerald-700' : 'text-rose-600'}`}>{note}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${cq.score >= 80 ? 'bg-emerald-500' : cq.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${cq.score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{cq.score}/100</span>
                  </div>
                </Card>
              );
            })()}
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
              SEO & GEO {lang === 'ko' ? '체크리스트' : lang === 'ja' ? 'チェックリスト' : 'Checklist'}
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
                ].filter(Boolean).length} / 22 {lang === 'ko' ? '통과' : lang === 'ja' ? '通過' : 'passed'}
              </span>
            </h4>
            <div className="space-y-3">
              {/* 타이틀 & 메타 */}
              <CheckSection
                title={t('diagnosis', 'titleMeta', lang)}
                icon={<Type size={16} />}
                items={[
                  {
                    label: lang === 'ko' ? 'Title 태그' : lang === 'ja' ? 'Titleタグ' : 'Title tag',
                    ok: !!geoData.meta.title && geoData.meta.titleLength >= 10 && geoData.meta.titleLength <= 60,
                    warn: !!geoData.meta.title && (geoData.meta.titleLength < 10 || geoData.meta.titleLength > 60),
                    value: geoData.meta.title
                      ? `"${geoData.meta.title.slice(0, 45)}${geoData.meta.title.length > 45 ? '…' : ''}" (${geoData.meta.titleLength}${lang === 'ko' ? '자' : lang === 'ja' ? '字' : ' chars'})`
                      : lang === 'ko' ? 'Title 태그 없음' : lang === 'ja' ? 'Titleタグなし' : 'No title tag',
                  },
                  {
                    label: 'Meta Description',
                    ok: !!geoData.meta.description && geoData.meta.descriptionLength >= 70 && geoData.meta.descriptionLength <= 160,
                    warn: !!geoData.meta.description && (geoData.meta.descriptionLength < 70 || geoData.meta.descriptionLength > 160),
                    value: geoData.meta.description
                      ? `${geoData.meta.descriptionLength}${lang === 'ko' ? '자' : lang === 'ja' ? '字' : ' chars'} ${geoData.meta.descriptionLength < 70 ? (lang === 'ko' ? '(짧음)' : lang === 'ja' ? '(短い)' : '(short)') : geoData.meta.descriptionLength > 160 ? (lang === 'ko' ? '(김)' : lang === 'ja' ? '(長い)' : '(long)') : (lang === 'ko' ? '(최적)' : lang === 'ja' ? '(最適)' : '(optimal)')}`
                      : lang === 'ko' ? 'Meta Description 없음' : lang === 'ja' ? 'Meta Descriptionなし' : 'No Meta Description',
                  },
                  {
                    label: lang === 'ko' ? 'Viewport (모바일)' : lang === 'ja' ? 'Viewport（モバイル）' : 'Viewport (Mobile)',
                    ok: !!geoData.meta.viewport,
                    warn: false,
                    value: geoData.meta.viewport ?? (lang === 'ko' ? 'Viewport 태그 없음 — 모바일 순위 하락' : lang === 'ja' ? 'Viewportタグなし — モバイル順位低下' : 'No viewport tag — mobile ranking impact'),
                  },
                  {
                    label: lang === 'ko' ? 'HTML lang 속성' : lang === 'ja' ? 'HTML lang属性' : 'HTML lang attr',
                    ok: !!geoData.meta.lang,
                    warn: false,
                    value: geoData.meta.lang ? `lang="${geoData.meta.lang}"` : (lang === 'ko' ? 'lang 속성 없음' : lang === 'ja' ? 'lang属性なし' : 'No lang attribute'),
                  },
                  {
                    label: lang === 'ko' ? 'Charset 인코딩' : lang === 'ja' ? 'Charset エンコード' : 'Charset encoding',
                    ok: !!geoData.meta.charset,
                    warn: false,
                    value: geoData.meta.charset ?? (lang === 'ko' ? 'Charset 선언 없음' : lang === 'ja' ? 'Charset未宣言' : 'No charset declaration'),
                  },
                  {
                    label: lang === 'ko' ? 'Robots 메타' : lang === 'ja' ? 'Robotsメタ' : 'Robots meta',
                    ok: !geoData.meta.isNoindex,
                    warn: false,
                    value: geoData.meta.isNoindex
                      ? (lang === 'ko' ? '⚠ noindex 감지 — 검색 색인 차단됨' : lang === 'ja' ? '⚠ noindex検出 — 検索インデックス除外' : '⚠ noindex detected — blocked from search index')
                      : geoData.meta.robotsMeta ?? (lang === 'ko' ? '설정 없음 (기본 색인)' : lang === 'ja' ? '未設定（デフォルトでインデックス）' : 'Not set (indexed by default)'),
                  },
                  {
                    label: 'Canonical URL',
                    ok: !!geoData.meta.canonical,
                    warn: false,
                    value: geoData.meta.canonical ? geoData.meta.canonical.slice(0, 50) + (geoData.meta.canonical.length > 50 ? '…' : '') : (lang === 'ko' ? 'Canonical 태그 없음' : lang === 'ja' ? 'Canonicalタグなし' : 'No canonical tag'),
                  },
                  {
                    label: lang === 'ko' ? '게시/수정일' : lang === 'ja' ? '公開/更新日' : 'Published/Modified',
                    ok: !!geoData.meta.articleModified || !!geoData.meta.articlePublished,
                    warn: false,
                    value: geoData.meta.articleModified
                      ? (lang === 'ko' ? '수정일: ' : lang === 'ja' ? '更新日: ' : 'Modified: ') + geoData.meta.articleModified.slice(0, 10)
                      : geoData.meta.articlePublished
                        ? (lang === 'ko' ? '게시일: ' : lang === 'ja' ? '公開日: ' : 'Published: ') + geoData.meta.articlePublished.slice(0, 10)
                        : (lang === 'ko' ? '날짜 메타 없음 (콘텐츠 신선도 불명확)' : lang === 'ja' ? '日付メタなし（コンテンツ鮮度不明）' : 'No date meta (content freshness unclear)'),
                  },
                  {
                    label: lang === 'ko' ? 'Author 정보' : lang === 'ja' ? 'Author情報' : 'Author info',
                    ok: !!geoData.meta.author,
                    warn: false,
                    value: geoData.meta.author ?? (lang === 'ko' ? 'Author 메타 없음 (E-E-A-T 약화)' : lang === 'ja' ? 'Authorメタなし（E-E-A-T弱化）' : 'No author meta (E-E-A-T weakened)'),
                  },
                ]}
              />

              {/* OG & SNS */}
              <CheckSection
                title={t('diagnosis', 'ogSns', lang)}
                icon={<Share2 size={16} />}
                defaultOpen={false}
                items={[
                  { label: 'og:title', ok: !!geoData.og.title, warn: false, value: geoData.og.title ?? (lang === 'ko' ? 'og:title 없음' : lang === 'ja' ? 'og:titleなし' : 'No og:title') },
                  { label: 'og:description', ok: !!geoData.og.description, warn: false, value: geoData.og.description ? geoData.og.description.slice(0, 50) + '…' : (lang === 'ko' ? 'og:description 없음' : lang === 'ja' ? 'og:descriptionなし' : 'No og:description') },
                  { label: 'og:image', ok: !!geoData.og.image, warn: false, value: geoData.og.image ? (lang === 'ko' ? '이미지 설정됨' : lang === 'ja' ? '画像設定済み' : 'Image set') : (lang === 'ko' ? 'og:image 없음 — SNS 공유 시 이미지 미표시' : lang === 'ja' ? 'og:imageなし — SNS共有時に画像非表示' : 'No og:image — image not shown on social share') },
                  { label: 'og:type', ok: !!geoData.og.type, warn: false, value: geoData.og.type ?? (lang === 'ko' ? 'og:type 없음' : lang === 'ja' ? 'og:typeなし' : 'No og:type') },
                  { label: 'Twitter Card', ok: !!geoData.og.twitterCard, warn: false, value: geoData.og.twitterCard ?? (lang === 'ko' ? 'twitter:card 없음' : lang === 'ja' ? 'twitter:cardなし' : 'No twitter:card') },
                  { label: 'Twitter Image', ok: !!geoData.og.twitterImage, warn: false, value: geoData.og.twitterImage ? (lang === 'ko' ? '이미지 설정됨' : lang === 'ja' ? '画像設定済み' : 'Image set') : (lang === 'ko' ? 'twitter:image 없음' : lang === 'ja' ? 'twitter:imageなし' : 'No twitter:image') },
                ]}
              />

              {/* 콘텐츠 구조 */}
              <CheckSection
                title={t('diagnosis', 'contentStruct', lang)}
                icon={<FileText size={16} />}
                defaultOpen={false}
                items={[
                  {
                    label: lang === 'ko' ? 'H1 태그' : lang === 'ja' ? 'H1タグ' : 'H1 tag',
                    ok: geoData.headings.h1Count === 1,
                    warn: geoData.headings.h1Count > 1,
                    value: geoData.headings.h1Count === 0
                      ? (lang === 'ko' ? 'H1 없음 — 핵심 키워드 누락' : lang === 'ja' ? 'H1なし — 主要キーワード欠落' : 'No H1 — key keyword missing')
                      : geoData.headings.h1Count === 1
                        ? `"${(geoData.headings.h1[0] ?? '').slice(0, 40)}"`
                        : lang === 'ko' ? `H1 ${geoData.headings.h1Count}개 중복 — 1개만 허용` : lang === 'ja' ? `H1 ${geoData.headings.h1Count}個重複 — 1個のみ許可` : `${geoData.headings.h1Count} H1 tags — only 1 allowed`,
                  },
                  {
                    label: lang === 'ko' ? 'H2 구조' : lang === 'ja' ? 'H2構造' : 'H2 structure',
                    ok: geoData.headings.h2Count > 0,
                    warn: false,
                    value: geoData.headings.h2Count > 0
                      ? (lang === 'ko' ? `H2 ${geoData.headings.h2Count}개, H3 ${geoData.headings.h3Count}개` : lang === 'ja' ? `H2 ${geoData.headings.h2Count}個, H3 ${geoData.headings.h3Count}個` : `H2: ${geoData.headings.h2Count}, H3: ${geoData.headings.h3Count}`)
                      : (lang === 'ko' ? 'H2 소제목 없음 — 콘텐츠 구조 취약' : lang === 'ja' ? 'H2小見出しなし — コンテンツ構造弱い' : 'No H2 subheadings — weak content structure'),
                  },
                  {
                    label: lang === 'ko' ? '콘텐츠 분량' : lang === 'ja' ? 'コンテンツ量' : 'Content length',
                    ok: geoData.content.wordCount >= 300,
                    warn: geoData.content.wordCount >= 300 && geoData.content.wordCount < 1000,
                    value: lang === 'ko'
                      ? `약 ${geoData.content.wordCount.toLocaleString()}단어 ${geoData.content.wordCount < 300 ? '(너무 짧음)' : geoData.content.wordCount < 1000 ? '(보통)' : '(양호)'}`
                      : lang === 'ja'
                      ? `約 ${geoData.content.wordCount.toLocaleString()}語 ${geoData.content.wordCount < 300 ? '（短すぎる）' : geoData.content.wordCount < 1000 ? '（普通）' : '（良好）'}`
                      : `~${geoData.content.wordCount.toLocaleString()} words ${geoData.content.wordCount < 300 ? '(too short)' : geoData.content.wordCount < 1000 ? '(average)' : '(good)'}`,
                  },
                  {
                    label: lang === 'ko' ? '내부 링크' : lang === 'ja' ? '内部リンク' : 'Internal links',
                    ok: geoData.content.internalLinks >= 3,
                    warn: geoData.content.internalLinks > 0 && geoData.content.internalLinks < 3,
                    value: lang === 'ko'
                      ? `${geoData.content.internalLinks}개 ${geoData.content.internalLinks === 0 ? '(없음)' : geoData.content.internalLinks < 3 ? '(3개 이상 권장)' : '(양호)'}`
                      : lang === 'ja'
                      ? `${geoData.content.internalLinks}個 ${geoData.content.internalLinks === 0 ? '（なし）' : geoData.content.internalLinks < 3 ? '（3個以上推奨）' : '（良好）'}`
                      : `${geoData.content.internalLinks} ${geoData.content.internalLinks === 0 ? '(none)' : geoData.content.internalLinks < 3 ? '(3+ recommended)' : '(good)'}`,
                  },
                  {
                    label: lang === 'ko' ? '외부 링크' : lang === 'ja' ? '外部リンク' : 'External links',
                    ok: geoData.content.externalLinks > 0,
                    warn: false,
                    value: lang === 'ko'
                      ? `${geoData.content.externalLinks}개 ${geoData.content.externalLinks === 0 ? '(신뢰 신호 약함)' : '(신뢰 도메인 연결)'}`
                      : lang === 'ja'
                      ? `${geoData.content.externalLinks}個 ${geoData.content.externalLinks === 0 ? '（信頼シグナル弱い）' : '（信頼ドメイン接続）'}`
                      : `${geoData.content.externalLinks} ${geoData.content.externalLinks === 0 ? '(weak trust signal)' : '(trusted domain links)'}`,
                  },
                  {
                    label: lang === 'ko' ? '이미지 Alt' : lang === 'ja' ? '画像 Alt' : 'Image Alt',
                    ok: geoData.images.missingAlt === 0,
                    warn: false,
                    value: geoData.images.missingAlt === 0
                      ? (lang === 'ko' ? `전체 ${geoData.images.total}개 Alt 완비` : lang === 'ja' ? `全${geoData.images.total}枚 Alt完備` : `All ${geoData.images.total} images have alt`)
                      : (lang === 'ko' ? `${geoData.images.missingAlt}/${geoData.images.total}개 Alt 누락` : lang === 'ja' ? `${geoData.images.missingAlt}/${geoData.images.total}枚 Alt未設定` : `${geoData.images.missingAlt}/${geoData.images.total} missing alt`),
                  },
                  {
                    label: 'Favicon',
                    ok: geoData.content.hasFavicon,
                    warn: false,
                    value: geoData.content.hasFavicon
                      ? (lang === 'ko' ? '파비콘 설정됨' : lang === 'ja' ? 'Favicon設定済み' : 'Favicon set')
                      : (lang === 'ko' ? '파비콘 없음' : lang === 'ja' ? 'Faviconなし' : 'No favicon'),
                  },
                ]}
              />

              {/* 구조화 데이터 */}
              <CheckSection
                title={t('diagnosis', 'schema', lang)}
                icon={<Code2 size={16} />}
                defaultOpen={false}
                items={[
                  {
                    label: lang === 'ko' ? 'JSON-LD 존재' : lang === 'ja' ? 'JSON-LD 存在' : 'JSON-LD exists',
                    ok: geoData.jsonLd.exists,
                    warn: false,
                    value: geoData.jsonLd.exists
                      ? (lang === 'ko' ? `${geoData.jsonLd.count}개 — ${geoData.jsonLd.types.join(', ')}` : lang === 'ja' ? `${geoData.jsonLd.count}個 — ${geoData.jsonLd.types.join(', ')}` : `${geoData.jsonLd.count} — ${geoData.jsonLd.types.join(', ')}`)
                      : (lang === 'ko' ? 'JSON-LD 없음 — 리치 스니펫 불가' : lang === 'ja' ? 'JSON-LDなし — リッチスニペット不可' : 'No JSON-LD — rich snippets unavailable'),
                  },
                  { label: 'Article / BlogPosting', ok: geoData.jsonLd.hasArticle, warn: false, value: geoData.jsonLd.hasArticle ? (lang === 'ko' ? '설정됨' : lang === 'ja' ? '設定済み' : 'Set') : (lang === 'ko' ? '없음 (블로그/뉴스에 필수)' : lang === 'ja' ? 'なし（ブログ/ニュースに必須）' : 'Missing (required for blog/news)') },
                  { label: 'FAQPage', ok: geoData.jsonLd.hasFaq, warn: false, value: geoData.jsonLd.hasFaq ? (lang === 'ko' ? '설정됨' : lang === 'ja' ? '設定済み' : 'Set') : (lang === 'ko' ? '없음 (Q&A 직접 노출 불가)' : lang === 'ja' ? 'なし（Q&A直接表示不可）' : 'Missing (no Q&A rich results)') },
                  { label: 'BreadcrumbList', ok: geoData.jsonLd.hasBreadcrumb, warn: false, value: geoData.jsonLd.hasBreadcrumb ? (lang === 'ko' ? '설정됨' : lang === 'ja' ? '設定済み' : 'Set') : (lang === 'ko' ? '없음 (URL 경로 표시 불가)' : lang === 'ja' ? 'なし（URLパス表示不可）' : 'Missing (no breadcrumb display)') },
                  { label: 'Organization', ok: geoData.jsonLd.hasOrganization, warn: false, value: geoData.jsonLd.hasOrganization ? (lang === 'ko' ? '설정됨' : lang === 'ja' ? '設定済み' : 'Set') : (lang === 'ko' ? '없음 (브랜드 신뢰도 약화)' : lang === 'ja' ? 'なし（ブランド信頼度低下）' : 'Missing (brand trust weakened)') },
                  { label: 'HowTo', ok: geoData.jsonLd.hasHowTo, warn: false, value: geoData.jsonLd.hasHowTo ? (lang === 'ko' ? '설정됨' : lang === 'ja' ? '設定済み' : 'Set') : (lang === 'ko' ? '없음 (해당 시 추가 권장)' : lang === 'ja' ? 'なし（該当する場合は追加推奨）' : 'Missing (add if applicable)') },
                ]}
              />

              {/* Rich Result 적격성 */}
              {geoData.richResults && geoData.jsonLd.exists && (
                <CheckSection
                  title={lang === 'ko' ? 'Rich Result 적격성 (Google 리치 스니펫)' : lang === 'ja' ? 'リッチリザルト適格性' : 'Rich Result Eligibility'}
                  icon={<Star size={16} />}
                  defaultOpen={false}
                  items={[
                    {
                      label: 'Article / BlogPosting',
                      ok: geoData.richResults.article.eligible,
                      warn: !geoData.richResults.article.eligible && geoData.jsonLd.hasArticle,
                      value: geoData.jsonLd.hasArticle
                        ? (geoData.richResults.article.eligible
                          ? (lang === 'ko' ? '리치 스니펫 적격' : 'Eligible for rich snippet')
                          : (lang === 'ko' ? `누락 필드: ${geoData.richResults.article.missingFields.join(', ')}` : `Missing: ${geoData.richResults.article.missingFields.join(', ')}`))
                        : (lang === 'ko' ? 'Article 스키마 없음' : 'No Article schema'),
                    },
                    {
                      label: 'Product',
                      ok: geoData.richResults.product.eligible,
                      warn: !geoData.richResults.product.eligible && geoData.jsonLd.hasProduct,
                      value: geoData.jsonLd.hasProduct
                        ? (geoData.richResults.product.eligible
                          ? (lang === 'ko' ? '리치 스니펫 적격' : 'Eligible for rich snippet')
                          : (lang === 'ko' ? `누락 필드: ${geoData.richResults.product.missingFields.join(', ')}` : `Missing: ${geoData.richResults.product.missingFields.join(', ')}`))
                        : (lang === 'ko' ? 'Product 스키마 없음' : 'No Product schema'),
                    },
                    {
                      label: 'FAQPage',
                      ok: geoData.richResults.faq.eligible,
                      warn: !geoData.richResults.faq.eligible && geoData.jsonLd.hasFaq,
                      value: geoData.jsonLd.hasFaq
                        ? (geoData.richResults.faq.eligible
                          ? (lang === 'ko' ? '리치 스니펫 적격' : 'Eligible for rich snippet')
                          : (lang === 'ko' ? `누락 필드: ${geoData.richResults.faq.missingFields.join(', ')}` : `Missing: ${geoData.richResults.faq.missingFields.join(', ')}`))
                        : (lang === 'ko' ? 'FAQPage 스키마 없음' : 'No FAQPage schema'),
                    },
                    {
                      label: 'BreadcrumbList',
                      ok: geoData.richResults.breadcrumb.eligible,
                      warn: !geoData.richResults.breadcrumb.eligible && geoData.jsonLd.hasBreadcrumb,
                      value: geoData.jsonLd.hasBreadcrumb
                        ? (geoData.richResults.breadcrumb.eligible
                          ? (lang === 'ko' ? '리치 스니펫 적격' : 'Eligible for rich snippet')
                          : (lang === 'ko' ? `누락 필드: ${geoData.richResults.breadcrumb.missingFields.join(', ')}` : `Missing: ${geoData.richResults.breadcrumb.missingFields.join(', ')}`))
                        : (lang === 'ko' ? 'BreadcrumbList 스키마 없음' : 'No BreadcrumbList schema'),
                    },
                    {
                      label: 'Organization',
                      ok: geoData.richResults.organization.eligible,
                      warn: !geoData.richResults.organization.eligible && geoData.jsonLd.hasOrganization,
                      value: geoData.jsonLd.hasOrganization
                        ? (geoData.richResults.organization.eligible
                          ? (lang === 'ko' ? '리치 스니펫 적격' : 'Eligible for rich snippet')
                          : (lang === 'ko' ? `누락 필드: ${geoData.richResults.organization.missingFields.join(', ')}` : `Missing: ${geoData.richResults.organization.missingFields.join(', ')}`))
                        : (lang === 'ko' ? 'Organization 스키마 없음' : 'No Organization schema'),
                    },
                  ]}
                />
              )}

              {/* 기술 SEO & GEO */}
              <CheckSection
                title={t('diagnosis', 'techSeo', lang)}
                icon={<Bot size={16} />}
                items={[
                  { label: 'HTTPS', ok: geoData.content.isHttps, warn: false, value: geoData.content.isHttps ? (lang === 'ko' ? 'HTTPS 적용됨' : lang === 'ja' ? 'HTTPS適用済み' : 'HTTPS enabled') : (lang === 'ko' ? '⚠ HTTP — 보안 경고 및 순위 하락' : lang === 'ja' ? '⚠ HTTP — セキュリティ警告と順位低下' : '⚠ HTTP — security warning & ranking impact') },
                  {
                    label: 'XML Sitemap',
                    ok: geoData.sitemap.exists || geoData.robotsTxt.hasSitemap,
                    warn: false,
                    value: geoData.sitemap.exists
                      ? (lang === 'ko' ? '/sitemap.xml 존재' : lang === 'ja' ? '/sitemap.xml 存在' : '/sitemap.xml found')
                      : geoData.robotsTxt.hasSitemap
                      ? (lang === 'ko' ? 'robots.txt에 Sitemap 선언됨' : lang === 'ja' ? 'robots.txtにSitemap宣言あり' : 'Sitemap declared in robots.txt')
                      : (lang === 'ko' ? 'Sitemap 없음 — 색인 속도 저하' : lang === 'ja' ? 'Sitemapなし — インデックス速度低下' : 'No sitemap — slower indexing'),
                  },
                  { label: 'robots.txt', ok: geoData.robotsTxt.exists, warn: false, value: geoData.robotsTxt.exists ? (lang === 'ko' ? '존재' : lang === 'ja' ? '存在' : 'Found') : (lang === 'ko' ? 'robots.txt 없음' : lang === 'ja' ? 'robots.txtなし' : 'No robots.txt') },
                  { label: lang === 'ko' ? 'AI 봇 정책' : lang === 'ja' ? 'AIボットポリシー' : 'AI Bot Policy', ok: !geoData.robotsTxt.llmBlocked, warn: false, value: geoData.robotsTxt.llmBlocked ? (lang === 'ko' ? 'GPTBot/ClaudeBot 차단됨' : lang === 'ja' ? 'GPTBot/ClaudeBot ブロック済み' : 'GPTBot/ClaudeBot blocked') : (lang === 'ko' ? 'AI 봇 크롤링 허용' : lang === 'ja' ? 'AIボットクロール許可' : 'AI bot crawling allowed') },
                  { label: 'llms.txt (GEO)', ok: geoData.llmsTxt.exists, warn: false, value: geoData.llmsTxt.exists ? (lang === 'ko' ? 'llms.txt 존재' : lang === 'ja' ? 'llms.txt 存在' : 'llms.txt found') : (lang === 'ko' ? 'llms.txt 없음 — GEO 노출 저하' : lang === 'ja' ? 'llms.txtなし — GEO露出低下' : 'No llms.txt — reduced GEO visibility') },
                ]}
              />
            </div>
          </Card>

          {/* Issues & Opportunities */}
          {/* AI 어드바이저 */}
          {(adviceLoading || advice) && (
            <Card className="p-6 border-[#eaeef2] dark:border-[#30363d] bg-[#000000] dark:bg-[#000000] text-white">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-white">
                <Sparkles size={18} className="text-white opacity-80" />
                {t('diagnosis', 'aiAdvice', lang)}
              </h4>
              {adviceLoading ? (
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                  {lang === 'ko' ? 'AI가 진단 결과를 분석하고 있습니다...' : lang === 'ja' ? 'AIが診断結果を分析しています...' : 'AI is analyzing the diagnosis results...'}
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
                {t('diagnosis', 'patches', lang)}
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
                      onClick={() => { navigator.clipboard.writeText(item.detail); onToast(t('common', 'copiedToClipboard', lang)); }}
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

      {/* 이메일 전송 인프라 진단 — URL 분석과 독립적으로 항상 표시 */}
      <Card className="p-6 border-indigo-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Mail size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">{lang === 'ko' ? '이메일 전송 인프라 진단' : lang === 'ja' ? 'メール配信インフラ診断' : 'Email Deliverability Check'}</h4>
            <p className="text-xs text-slate-500">{lang === 'ko' ? 'SPF · DKIM · DMARC · MX 레코드 검증 — 이메일 스팸 차단율 진단' : lang === 'ja' ? 'SPF · DKIM · DMARC · MX レコード検証' : 'SPF · DKIM · DMARC · MX record validation'}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={lang === 'ko' ? '도메인 입력 (예: example.com)' : lang === 'ja' ? 'ドメインを入力 (例: example.com)' : 'Enter domain (e.g. example.com)'}
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            value={emailDomain}
            onChange={(e) => setEmailDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runEmailCheck()}
          />
          <button
            onClick={runEmailCheck}
            disabled={emailLoading || !emailDomain.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm flex items-center gap-2 whitespace-nowrap"
          >
            {emailLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {lang === 'ko' ? '진단' : lang === 'ja' ? '診断' : 'Check'}
          </button>
        </div>
        {emailError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {emailError}
          </div>
        )}
        {emailData && (() => {
          const gc = gradeColor(emailData.grade);
          const records = [
            { label: 'MX 레코드', ok: emailData.mx.exists, warn: false, value: emailData.mx.exists ? emailData.mx.records[0] ?? '확인됨' : (lang === 'ko' ? 'MX 레코드 없음' : 'No MX record') },
            { label: 'SPF', ok: emailData.spf.valid, warn: emailData.spf.exists && !emailData.spf.valid, value: emailData.spf.value ?? (lang === 'ko' ? 'SPF 없음' : 'No SPF') },
            { label: 'DKIM (default)', ok: emailData.dkim.exists, warn: false, value: emailData.dkim.exists ? (lang === 'ko' ? 'DKIM 키 감지됨' : 'DKIM key detected') : (lang === 'ko' ? 'DKIM 미감지' : 'DKIM not found') },
            { label: 'DMARC', ok: emailData.dmarc.exists && emailData.dmarc.policy !== 'none', warn: emailData.dmarc.exists && emailData.dmarc.policy === 'none', value: emailData.dmarc.value ?? (lang === 'ko' ? 'DMARC 없음' : 'No DMARC') },
          ];
          return (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-slate-500">{emailData.domain}</span>
                <span className={`text-xl font-black px-3 py-1 rounded-xl border ${gc.bg} ${gc.text} ${gc.border}`}>{emailData.grade}</span>
                <span className="text-xs text-slate-400">{emailData.score}/100</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                {records.map(({ label, ok, warn, value }) => (
                  <div key={label} className={`flex items-start gap-2.5 p-3 rounded-xl ${ok ? 'bg-emerald-50' : warn ? 'bg-amber-50' : 'bg-rose-50'}`}>
                    {ok ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      : warn ? <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      : <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-slate-500 uppercase">{label}</div>
                      <div className={`text-xs mt-0.5 font-medium truncate ${ok ? 'text-emerald-700' : warn ? 'text-amber-700' : 'text-rose-700'}`}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {emailData.issues.length > 0 && (
                <div className="space-y-2">
                  {emailData.issues.map((issue, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800">{issue.title}</span>
                        <Badge variant={issue.impact === 'High' ? 'danger' : issue.impact === 'Medium' ? 'warning' : 'default'}>{issue.impact}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{issue.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
