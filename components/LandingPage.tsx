'use client';

import Link from 'next/link';
import {
  Zap, Globe, ArrowLeftRight, FileText, PenLine, Tag, Bot, BarChart3,
  Megaphone, LayoutDashboard, Sun, Moon, ChevronRight, CheckCircle,
} from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeProvider';
import AdUnit from '@/components/AdUnit';

const translations = {
  ko: {
    nav_cta: '무료로 시작하기',
    lang_toggle: 'EN',
    lang_href: '/en',
    hero_badge: 'AI-Powered · 완전 무료',
    hero_title: 'AI 시대의\n마케팅 운영 도구',
    hero_sub: 'GEO·SEO 진단부터 AI 언급율 측정까지, 시니어 마케터의 직관을 AI가 보조합니다.',
    hero_cta: '무료로 시작하기 →',
    hero_scroll: '기능 살펴보기 ↓',
    stats: ['9가지 AI 도구', '완전 무료', 'AI 검색 최적화', '한국어·영어 지원'],
    features_title: '마케팅의 모든 것을 AI로',
    features_sub: '진단부터 콘텐츠 생성, 성과 측정까지 — 하나의 플랫폼에서.',
    how_title: '3단계로 시작하세요',
    how_steps: [
      { num: '01', title: 'URL 입력', desc: 'AI가 즉시 GEO·SEO를 분석하고 개선점을 제시합니다.' },
      { num: '02', title: '키워드·콘텐츠 자동화', desc: '키워드 하나로 4채널 마케팅 소재를 한 번에 생성합니다.' },
      { num: '03', title: 'AI 점유율 측정', desc: 'ChatGPT·Gemini 내 브랜드 언급율을 경쟁사와 비교합니다.' },
    ],
    cta_title: '지금 바로 시작하세요',
    cta_sub: '신용카드 불필요 · 영구 무료',
    cta_btn: '무료로 시작하기 →',
    footer_privacy: 'Privacy Policy',
    footer_copy: '© 2025 MarketerOps.ai',
  },
  en: {
    nav_cta: 'Start for Free',
    lang_toggle: '한국어',
    lang_href: '/',
    hero_badge: 'AI-Powered · Free Forever',
    hero_title: 'AI-Powered\nMarketing Intelligence',
    hero_sub: 'From GEO & SEO diagnostics to AI Share of Voice — augment senior marketer intuition with AI.',
    hero_cta: 'Start for Free →',
    hero_scroll: 'Explore features ↓',
    stats: ['9 AI Tools', 'Completely Free', 'AI Search Optimized', 'KO · EN Support'],
    features_title: 'Everything Marketing, Powered by AI',
    features_sub: 'Diagnose, create, and measure — all in one platform.',
    how_title: 'Get started in 3 steps',
    how_steps: [
      { num: '01', title: 'Enter your URL', desc: 'AI instantly analyzes GEO & SEO visibility and surfaces improvements.' },
      { num: '02', title: 'Automate keywords & content', desc: 'One keyword → 4-channel marketing content, generated in seconds.' },
      { num: '03', title: 'Measure AI Share of Voice', desc: 'Track your brand mentions in ChatGPT & Gemini vs. competitors.' },
    ],
    cta_title: 'Start today',
    cta_sub: 'No credit card · Free forever',
    cta_btn: 'Start for Free →',
    footer_privacy: 'Privacy Policy',
    footer_copy: '© 2025 MarketerOps.ai',
  },
};

const features = [
  {
    icon: <Globe size={22} />,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    ko: { title: 'Engine Diagnosis', desc: 'PageSpeed + GEO 가시성을 AI가 즉시 분석' },
    en: { title: 'Engine Diagnosis', desc: 'AI-instant PageSpeed & GEO visibility analysis' },
  },
  {
    icon: <ArrowLeftRight size={22} />,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    ko: { title: 'Competitor Analysis', desc: '경쟁사 URL 비교 + AI 격차 분석' },
    en: { title: 'Competitor Analysis', desc: 'Competitor URL comparison & AI gap analysis' },
  },
  {
    icon: <FileText size={22} />,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    ko: { title: 'Content Orchestrator', desc: '소스 하나로 4채널 마케팅 소재 자동 생성' },
    en: { title: 'Content Orchestrator', desc: 'One source → 4-channel marketing content' },
  },
  {
    icon: <PenLine size={22} />,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    ko: { title: 'Content Rewriter', desc: 'SEO/GEO/가독성 목표별 AI 리라이팅' },
    en: { title: 'Content Rewriter', desc: 'AI rewriting by SEO / GEO / readability goal' },
  },
  {
    icon: <Tag size={22} />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    ko: { title: 'Keyword Analysis', desc: '검색 의도·경쟁도·롱테일·클러스터링' },
    en: { title: 'Keyword Analysis', desc: 'Search intent, competition, longtail & clustering' },
  },
  {
    icon: <Bot size={22} />,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    ko: { title: 'llms.txt 생성기', desc: 'AI 검색엔진 크롤링용 llms.txt 자동 생성' },
    en: { title: 'llms.txt Generator', desc: 'Auto-generate llms.txt for AI search crawlers' },
  },
  {
    icon: <BarChart3 size={22} />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    ko: { title: 'GA4 Analytics', desc: 'GA4 데이터 AI 분석 + 인사이트' },
    en: { title: 'GA4 Analytics', desc: 'AI-powered GA4 data analysis & insights' },
  },
  {
    icon: <Megaphone size={22} />,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    ko: { title: 'AI Share of Voice', desc: 'ChatGPT·Gemini 내 브랜드 언급율 측정' },
    en: { title: 'AI Share of Voice', desc: 'Measure brand mentions in ChatGPT & Gemini' },
  },
  {
    icon: <LayoutDashboard size={22} />,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    ko: { title: 'Ops Dashboard', desc: '진단 이력·콘텐츠 통계 종합 대시보드' },
    en: { title: 'Ops Dashboard', desc: 'Unified dashboard for diagnostics & content stats' },
  },
];

export default function LandingPage({ lang }: { lang: 'ko' | 'en' }) {
  const { dark, toggle } = useDarkMode();
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">

      {/* ── Sticky Nav ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={lang === 'ko' ? '/' : '/en'} className="flex items-center gap-2 text-indigo-600 font-black text-xl tracking-tighter">
            <Zap size={26} fill="currentColor" strokeWidth={2.5} />
            <span>MarketerOps<span className="text-slate-400 dark:text-slate-500 font-light">.ai</span></span>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggle}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              href={t.lang_href}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded transition-colors"
            >
              {t.lang_toggle}
            </Link>
            <Link
              href="/app"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              {t.nav_cta} <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[2px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800 mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          {t.hero_badge}
        </span>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 dark:text-slate-50 leading-tight whitespace-pre-line mb-6">
          {t.hero_title}
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          {t.hero_sub}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/app"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-200 dark:shadow-indigo-900/30 hover:scale-105"
          >
            <Zap size={20} fill="currentColor" />
            {t.hero_cta}
          </Link>
          <a
            href="#features"
            className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-sm transition-colors"
          >
            {t.hero_scroll}
          </a>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {t.stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <CheckCircle size={18} className="text-indigo-500" />
              <span className="font-black text-sm text-slate-700 dark:text-slate-300">{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-50 mb-4">
            {t.features_title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
            {t.features_sub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const copy = lang === 'ko' ? f.ko : f.en;
            return (
              <Link
                key={i}
                href="/app"
                className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-50 dark:hover:shadow-indigo-900/10 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.bg} ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {copy.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {copy.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── AdSense ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6">
        <AdUnit slot="XXXXXXXXXX" />
      </div>

      {/* ── How it Works ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-50 text-center mb-14">
            {t.how_title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.how_steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center md:items-start md:text-left">
                <span className="text-5xl font-black text-indigo-100 dark:text-indigo-900 leading-none mb-4 select-none">
                  {step.num}
                </span>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <Zap className="absolute -right-8 -bottom-8 text-white/10 w-40 h-40 rotate-12 pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-3 relative z-10">
            {t.cta_title}
          </h2>
          <p className="text-indigo-200 text-sm font-bold mb-8 relative z-10">
            {t.cta_sub}
          </p>
          <Link
            href="/app"
            className="relative z-10 inline-flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-600 font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-xl hover:scale-105"
          >
            <Zap size={20} fill="currentColor" />
            {t.cta_btn}
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-black text-slate-500 dark:text-slate-400">
            <Zap size={14} fill="currentColor" className="text-indigo-500" />
            MarketerOps.ai
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              {t.footer_privacy}
            </Link>
            <span>{t.footer_copy}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
