'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, Globe, ArrowLeftRight, FileText, PenLine, Tag, Bot, BarChart3,
  Megaphone, LayoutDashboard, Sun, Moon, ChevronRight, CheckCircle,
  ChevronDown, MessageCircle, TrendingUp, Shield, Clock, Star,
  Send, Loader2, X,
} from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeProvider';

// ─── i18n ────────────────────────────────────────────────────────────────────
const T = {
  ko: {
    nav_features: '기능', nav_faq: 'FAQ', nav_pricing: '요금제',
    nav_cta: '무료로 시작하기', lang_toggle: 'EN', lang_href: '/en',

    hero_badge: 'AI-Powered · 완전 무료',
    hero_title: 'AI 시대의\n마케팅 운영 도구',
    hero_sub: 'GEO·SEO 진단부터 AI 언급율 측정까지, 시니어 마케터의 직관을 AI가 보조합니다.',
    hero_cta: '무료로 시작하기 →',
    hero_scroll: '기능 살펴보기 ↓',

    stats: [
      { val: '9가지', label: 'AI 마케팅 도구' },
      { val: '무료', label: '신용카드 불필요' },
      { val: 'GEO', label: 'AI 검색 최적화' },
      { val: 'KO·EN', label: '한국어·영어 지원' },
    ],

    features_title: '마케팅의 모든 것을 AI로',
    features_sub: '진단부터 콘텐츠 생성, 성과 측정까지 — 하나의 플랫폼에서.',

    how_title: '3단계로 시작하세요',
    how_steps: [
      { num: '01', title: 'URL 입력', desc: 'AI가 즉시 GEO·SEO를 분석하고 개선점을 제시합니다.' },
      { num: '02', title: '키워드·콘텐츠 자동화', desc: '키워드 하나로 4채널 마케팅 소재를 한 번에 생성합니다.' },
      { num: '03', title: 'AI 점유율 측정', desc: 'ChatGPT·Gemini 내 브랜드 언급율을 경쟁사와 비교합니다.' },
    ],

    why_title: '왜 MarketerOps.ai인가?',
    why_items: [
      { icon: '⚡', title: '즉각적인 인사이트', desc: 'URL 하나로 PageSpeed, GEO, SEO를 동시에 분석. 결과까지 10초.' },
      { icon: '🧠', title: 'AI 시대 마케팅 전략', desc: 'ChatGPT·Gemini 시대의 GEO 최적화. LLM이 당신의 브랜드를 인용하게 만드세요.' },
      { icon: '💰', title: '완전 무료', desc: '월정액 없음. 크레딧 없음. 9가지 도구 전부 영구 무료.' },
    ],

    pricing_title: '심플한 요금제',
    pricing_free_name: 'Free Forever',
    pricing_free_price: '₩0',
    pricing_free_sub: '신용카드 불필요',
    pricing_free_features: ['9가지 AI 도구 전부 무제한', 'Engine Diagnosis (GEO + SEO)', 'AI 콘텐츠 자동화 4채널', '키워드 분석 + 클러스터링', 'AI Share of Voice 측정', 'GA4 분석 연동'],
    pricing_cta: '지금 바로 시작하기',

    faq_title: '자주 묻는 질문',
    faqs: [
      { q: 'GEO 최적화가 뭔가요?', a: 'GEO(Generative Engine Optimization)는 ChatGPT, Gemini, Perplexity 같은 AI 검색 엔진에 브랜드가 노출되도록 최적화하는 새로운 마케팅 전략입니다.' },
      { q: '정말 무료인가요?', a: '네, 완전 무료입니다. 9가지 AI 도구 모두 무제한으로 사용할 수 있습니다. 숨겨진 비용이나 크레딧 제한이 없습니다.' },
      { q: 'API 키가 필요한가요?', a: '필요 없습니다. MarketerOps.ai가 AI 분석에 필요한 모든 인프라를 제공합니다. 바로 사용하세요.' },
      { q: '데이터는 저장되나요?', a: '진단 이력은 브라우저 로컬에만 저장되며, 서버에 전송되지 않습니다. 개인정보 걱정 없이 사용하세요.' },
      { q: 'GA4 연동은 어떻게 하나요?', a: 'GA4 Analytics 탭에서 Google Analytics Property ID를 입력하면 됩니다. OAuth 인증 후 30일 데이터를 AI가 분석합니다.' },
    ],

    chat_title: 'AI 마케팅 상담',
    chat_sub: '궁금한 마케팅 전략을 물어보세요. 즉시 답변합니다.',
    chat_placeholder: '마케팅 질문을 입력하세요...',
    chat_welcome: '안녕하세요! AI 마케팅 어시스턴트입니다.\nSEO, GEO, 콘텐츠 전략, AI 검색 최적화 등 마케팅 관련 질문을 해주세요.',
    chat_suggestions: [
      'GEO 최적화를 시작하려면 어떻게 해야 하나요?',
      'AI 시대에 SEO 전략은 어떻게 바뀌나요?',
      'llms.txt 파일이 왜 중요한가요?',
      '스타트업에게 가장 중요한 마케팅 채널은?',
    ],

    cta_title: '지금 바로 시작하세요',
    cta_sub: '신용카드 불필요 · 영구 무료',
    cta_btn: '무료로 시작하기 →',

    footer_privacy: 'Privacy Policy',
    footer_copy: '© 2025 MarketerOps.ai · AI-Powered Marketing Intelligence',
  },
  en: {
    nav_features: 'Features', nav_faq: 'FAQ', nav_pricing: 'Pricing',
    nav_cta: 'Start for Free', lang_toggle: '한국어', lang_href: '/',

    hero_badge: 'AI-Powered · Free Forever',
    hero_title: 'AI-Powered\nMarketing Intelligence',
    hero_sub: 'From GEO & SEO diagnostics to AI Share of Voice — augment senior marketer intuition with AI.',
    hero_cta: 'Start for Free →',
    hero_scroll: 'Explore features ↓',

    stats: [
      { val: '9', label: 'AI Marketing Tools' },
      { val: 'Free', label: 'No credit card' },
      { val: 'GEO', label: 'AI Search Optimized' },
      { val: 'KO·EN', label: 'Bilingual support' },
    ],

    features_title: 'Everything Marketing, Powered by AI',
    features_sub: 'Diagnose, create, and measure — all in one platform.',

    how_title: 'Get started in 3 steps',
    how_steps: [
      { num: '01', title: 'Enter your URL', desc: 'AI instantly analyzes GEO & SEO visibility and surfaces improvements.' },
      { num: '02', title: 'Automate keywords & content', desc: 'One keyword → 4-channel marketing content, generated in seconds.' },
      { num: '03', title: 'Measure AI Share of Voice', desc: 'Track your brand mentions in ChatGPT & Gemini vs. competitors.' },
    ],

    why_title: 'Why MarketerOps.ai?',
    why_items: [
      { icon: '⚡', title: 'Instant insights', desc: 'Analyze PageSpeed, GEO, and SEO simultaneously from a single URL. Results in 10 seconds.' },
      { icon: '🧠', title: 'AI-era marketing strategy', desc: 'GEO optimization for the ChatGPT & Gemini era. Make LLMs cite your brand.' },
      { icon: '💰', title: 'Completely free', desc: 'No subscriptions. No credits. All 9 tools free forever.' },
    ],

    pricing_title: 'Simple pricing',
    pricing_free_name: 'Free Forever',
    pricing_free_price: '$0',
    pricing_free_sub: 'No credit card required',
    pricing_free_features: ['All 9 AI tools, unlimited', 'Engine Diagnosis (GEO + SEO)', 'AI Content Automation (4 channels)', 'Keyword Analysis + Clustering', 'AI Share of Voice measurement', 'GA4 Analytics integration'],
    pricing_cta: 'Get started now',

    faq_title: 'Frequently Asked Questions',
    faqs: [
      { q: 'What is GEO optimization?', a: 'GEO (Generative Engine Optimization) is a new marketing strategy for optimizing brand visibility in AI search engines like ChatGPT, Gemini, and Perplexity.' },
      { q: 'Is it really free?', a: 'Yes, completely free. All 9 AI tools are available with unlimited usage. No hidden fees or credit limits.' },
      { q: 'Do I need an API key?', a: 'No. MarketerOps.ai provides all the AI infrastructure needed. Just start using it.' },
      { q: 'Is my data stored?', a: 'Diagnosis history is stored locally in your browser only, never sent to a server. Use it without privacy concerns.' },
      { q: 'How do I connect GA4?', a: 'Enter your Google Analytics Property ID in the GA4 Analytics tab. After OAuth authentication, AI analyzes 30 days of data.' },
    ],

    chat_title: 'AI Marketing Consultation',
    chat_sub: 'Ask any marketing strategy question. Get instant answers.',
    chat_placeholder: 'Ask a marketing question...',
    chat_welcome: 'Hello! I\'m your AI Marketing Assistant.\nAsk me about SEO, GEO, content strategy, AI search optimization, and more.',
    chat_suggestions: [
      'How do I start with GEO optimization?',
      'How is SEO strategy changing in the AI era?',
      'Why is the llms.txt file important?',
      'What is the most important marketing channel for startups?',
    ],

    cta_title: 'Start today',
    cta_sub: 'No credit card · Free forever',
    cta_btn: 'Start for Free →',

    footer_privacy: 'Privacy Policy',
    footer_copy: '© 2025 MarketerOps.ai · AI-Powered Marketing Intelligence',
  },
};

// ─── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <Globe size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', ko: { title: 'Engine Diagnosis', desc: 'PageSpeed + GEO 가시성을 AI가 즉시 분석' }, en: { title: 'Engine Diagnosis', desc: 'AI-instant PageSpeed & GEO visibility analysis' } },
  { icon: <ArrowLeftRight size={20} />, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', ko: { title: 'Competitor Analysis', desc: '경쟁사 URL 비교 + AI 격차 분석' }, en: { title: 'Competitor Analysis', desc: 'Competitor URL comparison & AI gap analysis' } },
  { icon: <FileText size={20} />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', ko: { title: 'Content Orchestrator', desc: '소스 하나로 4채널 마케팅 소재 자동 생성' }, en: { title: 'Content Orchestrator', desc: 'One source → 4-channel marketing content' } },
  { icon: <PenLine size={20} />, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20', ko: { title: 'Content Rewriter', desc: 'SEO/GEO/가독성 목표별 AI 리라이팅' }, en: { title: 'Content Rewriter', desc: 'AI rewriting by SEO / GEO / readability goal' } },
  { icon: <Tag size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ko: { title: 'Keyword Analysis', desc: '검색 의도·경쟁도·롱테일·클러스터링' }, en: { title: 'Keyword Analysis', desc: 'Search intent, competition, longtail & clustering' } },
  { icon: <Bot size={20} />, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', ko: { title: 'llms.txt 생성기', desc: 'AI 검색엔진 크롤링용 llms.txt 자동 생성' }, en: { title: 'llms.txt Generator', desc: 'Auto-generate llms.txt for AI search crawlers' } },
  { icon: <BarChart3 size={20} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', ko: { title: 'GA4 Analytics', desc: 'GA4 데이터 AI 분석 + 인사이트' }, en: { title: 'GA4 Analytics', desc: 'AI-powered GA4 data analysis & insights' } },
  { icon: <Megaphone size={20} />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', ko: { title: 'AI Share of Voice', desc: 'ChatGPT·Gemini 내 브랜드 언급율 측정' }, en: { title: 'AI Share of Voice', desc: 'Measure brand mentions in ChatGPT & Gemini' } },
  { icon: <LayoutDashboard size={20} />, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800', ko: { title: 'Ops Dashboard', desc: '진단 이력·콘텐츠 통계 종합 대시보드' }, en: { title: 'Ops Dashboard', desc: 'Unified dashboard for diagnostics & content stats' } },
];

// ─── Inline Chat ──────────────────────────────────────────────────────────────
interface Msg { role: 'user' | 'assistant'; content: string; }

function LandingChat({ t }: { t: typeof T['ko'] }) {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: t.chat_welcome }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || '오류가 발생했습니다.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '네트워크 오류가 발생했습니다.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-100 dark:shadow-slate-900/50">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
          <Bot size={18} />
        </div>
        <div>
          <p className="font-black text-sm">AI 마케팅 어시스턴트</p>
          <p className="text-[10px] text-indigo-200">MarketerOps.ai · 즉시 응답</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] text-indigo-200 font-bold">온라인</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto p-5 space-y-3 bg-slate-50 dark:bg-slate-950/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                <Bot size={14} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-700 shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-indigo-600" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2 shadow-sm">
              <Loader2 size={13} className="animate-spin text-indigo-500" />
              <span className="text-xs text-slate-500">답변 생성 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {t.chat_suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="text-[11px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-400 rounded-full font-bold transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t.chat_placeholder}
          className="flex-1 text-sm px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-400 dark:focus:border-indigo-600 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl transition-colors shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{item.q}</span>
            <ChevronDown
              size={16}
              className={'text-slate-400 transition-transform duration-200 shrink-0 ml-4 ' + (open === i ? 'rotate-180' : '')}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function LandingPage({ lang }: { lang: 'ko' | 'en' }) {
  const { dark, toggle } = useDarkMode();
  const t = T[lang];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={lang === 'ko' ? '/' : '/en'} className="flex items-center gap-2 text-indigo-600 font-black text-xl tracking-tighter">
            <Zap size={24} fill="currentColor" strokeWidth={2.5} />
            <span>MarketerOps<span className="text-slate-400 dark:text-slate-500 font-light">.ai</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.nav_features}</a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.nav_pricing}</a>
            <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t.nav_faq}</a>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={toggle} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" aria-label="Toggle dark mode">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href={t.lang_href} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 px-2 py-1 rounded transition-colors">
              {t.lang_toggle}
            </Link>
            <Link href="/app" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
              {t.nav_cta} <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/app" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-200 dark:shadow-indigo-900/30 hover:scale-105">
            <Zap size={20} fill="currentColor" />
            {t.hero_cta}
          </Link>
          <a href="#features" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-sm transition-colors">
            {t.hero_scroll}
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{s.val}</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why ─────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-center text-slate-900 dark:text-slate-50 mb-10">
            {t.why_title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.why_items.map((w, i) => (
              <div key={i} className="flex flex-col gap-3 p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-3xl">{w.icon}</span>
                <h3 className="font-black text-slate-800 dark:text-slate-100">{w.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-50 mb-4">{t.features_title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">{t.features_sub}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const copy = lang === 'ko' ? f.ko : f.en;
            return (
              <Link key={i} href="/app" className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-50 dark:hover:shadow-indigo-900/10 transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.bg} ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {copy.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{copy.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────────────────── */}
      <section className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-50 text-center mb-14">
            {t.how_title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.how_steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center md:items-start md:text-left">
                <span className="text-5xl font-black text-indigo-100 dark:text-indigo-900 leading-none mb-4 select-none">{step.num}</span>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-50 mb-4">{t.pricing_title}</h2>
        </div>
        <div className="max-w-sm mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 text-white text-center relative overflow-hidden">
            <Zap className="absolute -right-6 -top-6 w-24 h-24 text-white/10 rotate-12 pointer-events-none" />
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">{t.pricing_free_name}</span>
            <div className="text-5xl font-black mb-1">{t.pricing_free_price}</div>
            <p className="text-indigo-200 text-sm mb-8">{t.pricing_free_sub}</p>
            <ul className="text-sm space-y-3 mb-8 text-left">
              {t.pricing_free_features.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/app" className="block w-full bg-white hover:bg-indigo-50 text-indigo-600 font-black py-3.5 rounded-2xl transition-all hover:scale-105 shadow-lg">
              {t.pricing_cta}
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Chat Consultation ─────────────────────────────────────────── */}
      <section id="chat" className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800 mb-4">
              <MessageCircle size={14} />
              {t.chat_title}
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-50 mb-3">
              {t.chat_title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">{t.chat_sub}</p>
          </div>
          <LandingChat t={t} />
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 md:py-28">
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-50 text-center mb-14">
          {t.faq_title}
        </h2>
        <FAQ items={t.faqs} />
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20 md:pb-28">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          <Zap className="absolute -right-8 -bottom-8 text-white/10 w-40 h-40 rotate-12 pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-3 relative z-10">{t.cta_title}</h2>
          <p className="text-indigo-200 text-sm font-bold mb-8 relative z-10">{t.cta_sub}</p>
          <Link href="/app" className="relative z-10 inline-flex items-center gap-2 bg-white hover:bg-indigo-50 text-indigo-600 font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-xl hover:scale-105">
            <Zap size={20} fill="currentColor" />
            {t.cta_btn}
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300">
              <Zap size={18} fill="currentColor" className="text-indigo-500" />
              MarketerOps.ai
            </div>
            <nav className="flex items-center gap-6 text-xs font-bold text-slate-400">
              <a href="#features" className="hover:text-indigo-500 transition-colors">{t.nav_features}</a>
              <a href="#pricing" className="hover:text-indigo-500 transition-colors">{t.nav_pricing}</a>
              <a href="#faq" className="hover:text-indigo-500 transition-colors">{t.nav_faq}</a>
              <Link href="/privacy" className="hover:text-indigo-500 transition-colors">{t.footer_privacy}</Link>
            </nav>
          </div>
          <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6">
            {t.footer_copy}
          </div>
        </div>
      </footer>
    </div>
  );
}
