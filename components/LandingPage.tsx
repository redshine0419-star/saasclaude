'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, Globe, ArrowLeftRight, FileText, PenLine, Tag, Bot, BarChart3,
  Megaphone, LayoutDashboard, Sun, Moon, ChevronRight, CheckCircle,
  ChevronDown, MessageCircle, Send, Loader2, Menu, X,
} from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeProvider';

const T = {
  ko: {
    nav_features: '기능', nav_faq: 'FAQ', nav_pricing: '요금제',
    nav_blog: '블로그', nav_blog_href: '/blog/ko',
    nav_cta: '무료로 시작하기', lang_toggle: 'EN', lang_href: '/en',

    hero_badge: 'AI-Powered · 완전 무료',
    hero_title: 'AI 시대의\n마케팅 운영 도구',
    hero_sub: 'GEO·SEO 진단부터 AI 언급율 측정까지, 시니어 마케터의 직관을 AI가 보조합니다.',
    hero_cta: '무료로 시작하기',
    hero_sub_cta: '기능 살펴보기',

    stats: [
      { val: '9', label: 'AI 마케팅 도구' },
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

    why_title: '왜 GrowWeb.me인가?',
    why_items: [
      { title: '즉각적인 인사이트', desc: 'URL 하나로 PageSpeed, GEO, SEO를 동시에 분석. 결과까지 10초.' },
      { title: 'AI 시대 마케팅 전략', desc: 'ChatGPT·Gemini 시대의 GEO 최적화. LLM이 당신의 브랜드를 인용하게 만드세요.' },
      { title: '완전 무료', desc: '월정액 없음. 크레딧 없음. 9가지 도구 전부 영구 무료.' },
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
      { q: 'API 키가 필요한가요?', a: '필요 없습니다. GrowWeb.me가 AI 분석에 필요한 모든 인프라를 제공합니다. 바로 사용하세요.' },
      { q: '데이터는 저장되나요?', a: '진단 이력은 브라우저 로컬에만 저장되며, 서버에 전송되지 않습니다. 개인정보 걱정 없이 사용하세요.' },
      { q: 'GA4 연동은 어떻게 하나요?', a: 'GA4 Analytics 탭에서 Google Analytics Property ID를 입력하면 됩니다. OAuth 인증 후 30일 데이터를 AI가 분석합니다.' },
    ],

    chat_title: 'AI 마케팅 상담',
    chat_sub: '궁금한 마케팅 전략을 물어보세요. 즉시 답변합니다.',
    chat_placeholder: '마케팅 질문을 입력하세요...',
    chat_welcome: '안녕하세요! AI 마케팅 어시스턴트입니다.\nSEO, GEO, 콘텐츠 전략 등 마케팅 관련 질문을 해주세요.',
    chat_suggestions: ['GEO 최적화를 시작하려면?', 'AI 시대 SEO 전략 변화', 'llms.txt가 왜 중요한가요?', '스타트업 추천 마케팅 채널'],

    cta_title: '지금 바로 시작하세요',
    cta_sub: '신용카드 불필요 · 영구 무료',
    cta_btn: '무료로 시작하기',

    footer_privacy: 'Privacy Policy',
    footer_copy: '© 2025 GrowWeb.me · AI-Powered Marketing Intelligence',
  },
  en: {
    nav_features: 'Features', nav_faq: 'FAQ', nav_pricing: 'Pricing',
    nav_blog: 'Blog', nav_blog_href: '/blog/en',
    nav_cta: 'Start for Free', lang_toggle: 'EN', lang_href: '/en',

    hero_badge: 'AI-Powered · Free Forever',
    hero_title: 'AI-Powered\nMarketing Intelligence',
    hero_sub: 'From GEO & SEO diagnostics to AI Share of Voice — augment senior marketer intuition with AI.',
    hero_cta: 'Start for Free',
    hero_sub_cta: 'Explore features',

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

    why_title: 'Why GrowWeb.me?',
    why_items: [
      { title: 'Instant insights', desc: 'Analyze PageSpeed, GEO, and SEO simultaneously from a single URL. Results in 10 seconds.' },
      { title: 'AI-era marketing strategy', desc: 'GEO optimization for the ChatGPT & Gemini era. Make LLMs cite your brand.' },
      { title: 'Completely free', desc: 'No subscriptions. No credits. All 9 tools free forever.' },
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
      { q: 'Do I need an API key?', a: 'No. GrowWeb.me provides all the AI infrastructure needed. Just start using it.' },
      { q: 'Is my data stored?', a: 'Diagnosis history is stored locally in your browser only, never sent to a server. Use it without privacy concerns.' },
      { q: 'How do I connect GA4?', a: 'Enter your Google Analytics Property ID in the GA4 Analytics tab. After OAuth authentication, AI analyzes 30 days of data.' },
    ],

    chat_title: 'AI Marketing Consultation',
    chat_sub: 'Ask any marketing strategy question. Get instant answers.',
    chat_placeholder: 'Ask a marketing question...',
    chat_welcome: "Hello! I'm your AI Marketing Assistant.\nAsk me about SEO, GEO, content strategy, and more.",
    chat_suggestions: ['How to start with GEO?', 'SEO in the AI era', 'Why is llms.txt important?', 'Best channel for startups'],

    cta_title: 'Start today',
    cta_sub: 'No credit card · Free forever',
    cta_btn: 'Start for Free',

    footer_privacy: 'Privacy Policy',
    footer_copy: '© 2025 GrowWeb.me · AI-Powered Marketing Intelligence',
  },
  ja: {
    nav_features: '機能', nav_faq: 'FAQ', nav_pricing: '料金プラン',
    nav_blog: 'ブログ', nav_blog_href: '/blog/ja',
    nav_cta: '無料で始める', lang_toggle: 'JA', lang_href: '/ja',

    hero_badge: 'AI搭載 · 完全無料',
    hero_title: 'AIマーケティング\n運営ツール',
    hero_sub: 'GEO・SEO診断からAIシェアオブボイス測定まで、上級マーケターの直感をAIが補助します。',
    hero_cta: '無料で始める',
    hero_sub_cta: '機能を見る',

    stats: [
      { val: '9', label: 'AIマーケティングツール' },
      { val: '無料', label: 'クレジットカード不要' },
      { val: 'GEO', label: 'AI検索最適化' },
      { val: 'KO·EN·JA', label: '多言語サポート' },
    ],

    features_title: 'マーケティングのすべてをAIで',
    features_sub: '診断からコンテンツ生成、成果測定まで — 1つのプラットフォームで。',

    how_title: '3ステップで始める',
    how_steps: [
      { num: '01', title: 'URLを入力', desc: 'AIが即座にGEO・SEOを分析し、改善点を提示します。' },
      { num: '02', title: 'キーワード・コンテンツ自動化', desc: 'キーワード1つで4チャンネルのマーケティング素材を一括生成。' },
      { num: '03', title: 'AI占有率測定', desc: 'ChatGPT・Gemini内のブランド言及率を競合他社と比較します。' },
    ],

    why_title: 'なぜGrowWeb.meなのか？',
    why_items: [
      { title: '即時インサイト', desc: 'URLひとつでPageSpeed、GEO、SEOを同時分析。結果まで10秒。' },
      { title: 'AI時代のマーケティング戦略', desc: 'ChatGPT・Gemini時代のGEO最適化。LLMにあなたのブランドを引用させましょう。' },
      { title: '完全無料', desc: '月額料金なし。クレジットなし。9つのツールすべて永久無料。' },
    ],

    pricing_title: 'シンプルな料金プラン',
    pricing_free_name: 'Free Forever',
    pricing_free_price: '¥0',
    pricing_free_sub: 'クレジットカード不要',
    pricing_free_features: ['9つのAIツール全て無制限', 'エンジン診断 (GEO + SEO)', 'AIコンテンツ自動化（4チャンネル）', 'キーワード分析 + クラスタリング', 'AIシェアオブボイス測定', 'GA4アナリティクス連携'],
    pricing_cta: '今すぐ始める',

    faq_title: 'よくある質問',
    faqs: [
      { q: 'GEO最適化とは何ですか？', a: 'GEO（Generative Engine Optimization）は、ChatGPT、Gemini、Perplexityなどに自社ブランドが引用されるよう最適化する新しいマーケティング戦略です。' },
      { q: '本当に無料ですか？', a: 'はい、完全無料です。9つのAIツールすべて無制限で使用できます。隠れた費用やクレジット制限はありません。' },
      { q: 'APIキーは必要ですか？', a: '不要です。GrowWeb.meがAI分析に必要なすべてのインフラを提供しています。すぐにご利用いただけます。' },
      { q: 'データは保存されますか？', a: '診断履歴はブラウザのローカルにのみ保存され、サーバーには送信されません。プライバシーの心配なくご使用ください。' },
      { q: 'GA4連携はどうすればいいですか？', a: 'GA4 AnalyticsタブにGoogle Analytics Property IDを入力してください。OAuth認証後、30日間のデータをAIが分析します。' },
    ],

    chat_title: 'AIマーケティング相談',
    chat_sub: 'マーケティング戦略の疑問をお気軽にどうぞ。即座に回答します。',
    chat_placeholder: 'マーケティングの質問を入力してください...',
    chat_welcome: 'こんにちは！AIマーケティングアシスタントです。\nSEO、GEO、コンテンツ戦略などマーケティングに関するご質問をどうぞ。',
    chat_suggestions: ['GEO最適化を始めるには？', 'AI時代のSEO戦略', 'llms.txtが重要な理由', 'スタートアップ向けおすすめチャンネル'],

    cta_title: '今すぐ始めましょう',
    cta_sub: 'クレジットカード不要 · 永久無料',
    cta_btn: '無料で始める',

    footer_privacy: 'プライバシーポリシー',
    footer_copy: '© 2025 GrowWeb.me · AI搭載マーケティングインテリジェンス',
  },
};

const FEATURES = [
  { icon: <Globe size={18} />, ko: { title: 'Engine Diagnosis', desc: 'PageSpeed + GEO 가시성을 AI가 즉시 분석' }, en: { title: 'Engine Diagnosis', desc: 'AI-instant PageSpeed & GEO visibility analysis' }, ja: { title: 'エンジン診断', desc: 'PageSpeed・GEO可視性をAIが即時分析' } },
  { icon: <ArrowLeftRight size={18} />, ko: { title: 'Competitor Analysis', desc: '경쟁사 URL 비교 + AI 격차 분석' }, en: { title: 'Competitor Analysis', desc: 'Competitor URL comparison & AI gap analysis' }, ja: { title: '競合分析', desc: '競合URL比較・AIギャップ分析' } },
  { icon: <FileText size={18} />, ko: { title: 'Content Orchestrator', desc: '소스 하나로 4채널 마케팅 소재 자동 생성' }, en: { title: 'Content Orchestrator', desc: 'One source → 4-channel marketing content' }, ja: { title: 'コンテンツ自動化', desc: '1つのソースから4チャンネルのマーケティング素材を一括生成' } },
  { icon: <PenLine size={18} />, ko: { title: 'Content Rewriter', desc: 'SEO/GEO/가독성 목표별 AI 리라이팅' }, en: { title: 'Content Rewriter', desc: 'AI rewriting by SEO / GEO / readability goal' }, ja: { title: 'コンテンツ書き直し', desc: 'SEO・GEO・可読性の目的別にAIがリライト' } },
  { icon: <Tag size={18} />, ko: { title: 'Keyword Analysis', desc: '검색 의도·경쟁도·롱테일·클러스터링' }, en: { title: 'Keyword Analysis', desc: 'Search intent, competition, longtail & clustering' }, ja: { title: 'キーワード分析', desc: '検索意図・競合度・ロングテール・クラスタリング' } },
  { icon: <Bot size={18} />, ko: { title: 'llms.txt 생성기', desc: 'AI 검색엔진 크롤링용 llms.txt 자동 생성' }, en: { title: 'llms.txt Generator', desc: 'Auto-generate llms.txt for AI search crawlers' }, ja: { title: 'llms.txt生成', desc: 'AI検索エンジン向けllms.txtを自動生成' } },
  { icon: <BarChart3 size={18} />, ko: { title: 'GA4 Analytics', desc: 'GA4 데이터 AI 분석 + 인사이트' }, en: { title: 'GA4 Analytics', desc: 'AI-powered GA4 data analysis & insights' }, ja: { title: 'GA4アナリティクス', desc: 'GA4データをAIが分析してインサイトを提供' } },
  { icon: <Megaphone size={18} />, ko: { title: 'AI Share of Voice', desc: 'ChatGPT·Gemini 내 브랜드 언급율 측정' }, en: { title: 'AI Share of Voice', desc: 'Measure brand mentions in ChatGPT & Gemini' }, ja: { title: 'AIシェアオブボイス', desc: 'ChatGPT・Gemini内のブランド言及率を測定' } },
  { icon: <LayoutDashboard size={18} />, ko: { title: 'Ops Dashboard', desc: '진단 이력·콘텐츠 통계 종합 대시보드' }, en: { title: 'Ops Dashboard', desc: 'Unified dashboard for diagnostics & content stats' }, ja: { title: 'ダッシュボード', desc: '診断履歴・コンテンツ統計の総合ダッシュボード' } },
];

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || '오류가 발생했습니다.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '네트워크 오류가 발생했습니다.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden bg-white dark:bg-[#0d1117]">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
        <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
          <Bot size={15} className="text-white dark:text-black" />
        </div>
        <div>
          <p className="font-bold text-sm text-[#24292f] dark:text-[#e6edf3]">AI 마케팅 어시스턴트</p>
          <p className="text-[11px] text-[#57606a] dark:text-[#8b949e]">GrowWeb.me</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#2da44e] rounded-full" />
          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e] font-medium">온라인</span>
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-white dark:bg-[#0d1117]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-black dark:bg-white flex items-center justify-center mr-2 shrink-0 mt-0.5">
                <Bot size={12} className="text-white dark:text-black" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-[#000000] text-white'
                : 'bg-[#f6f8fa] dark:bg-[#161b22] text-[#24292f] dark:text-[#e6edf3] border border-[#d0d7de] dark:border-[#30363d]'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-black dark:bg-white flex items-center justify-center shrink-0">
              <Bot size={12} className="text-white dark:text-black" />
            </div>
            <div className="bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] px-3 py-2 rounded-lg flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-[#57606a]" />
              <span className="text-xs text-[#57606a]">답변 생성 중...</span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="px-4 py-3 border-t border-[#d0d7de] dark:border-[#30363d] flex flex-wrap gap-2 bg-[#f6f8fa] dark:bg-[#161b22]">
          {t.chat_suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)}
              className="text-[11px] px-3 py-1.5 bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] hover:border-[#000] dark:hover:border-white text-[#24292f] dark:text-[#e6edf3] rounded-md font-medium transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 p-3 border-t border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117]">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder={t.chat_placeholder} disabled={loading}
          className="flex-1 text-sm px-3 py-2 bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-md outline-none focus:border-[#000] dark:focus:border-white text-[#24292f] dark:text-[#e6edf3] placeholder-[#57606a] transition-colors"
        />
        <button onClick={() => send(input)} disabled={!input.trim() || loading}
          className="w-9 h-9 flex items-center justify-center bg-[#000] hover:bg-[#333] disabled:opacity-30 text-white rounded-md transition-colors shrink-0 dark:bg-white dark:hover:bg-[#eee] dark:text-black">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-[#d0d7de] dark:divide-[#30363d] border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
      {items.map((item, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] transition-colors">
            <span className="font-semibold text-sm text-[#24292f] dark:text-[#e6edf3]">{item.q}</span>
            <ChevronDown size={16} className={'text-[#57606a] transition-transform duration-200 shrink-0 ml-4 ' + (open === i ? 'rotate-180' : '')} />
          </button>
          {open === i && (
            <div className="px-6 pb-4 text-sm text-[#57606a] dark:text-[#8b949e] leading-relaxed bg-[#f6f8fa] dark:bg-[#161b22]">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage({ lang }: { lang: 'ko' | 'en' | 'ja' }) {
  const { dark, toggle } = useDarkMode();
  const t = T[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] font-sans">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-sm border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={lang === 'ko' ? '/' : lang === 'ja' ? '/ja' : '/en'} className="flex items-center gap-2 font-black text-xl tracking-tight text-[#24292f] dark:text-[#e6edf3]">
            <Zap size={22} fill="currentColor" />
            <span>GrowWeb<span className="text-[#57606a] dark:text-[#8b949e] font-light">.me</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#57606a] dark:text-[#8b949e]">
            <a href="#features" className="hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">{t.nav_features}</a>
            <a href="#pricing" className="hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">{t.nav_pricing}</a>
            <a href="#faq" className="hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">{t.nav_faq}</a>
            <Link href={t.nav_blog_href} className="hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">{t.nav_blog}</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 text-[#57606a] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] rounded-md transition-colors">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)}
                className="text-xs font-medium text-[#57606a] hover:text-[#24292f] dark:hover:text-[#e6edf3] px-2 py-1 rounded transition-colors flex items-center gap-1">
                {lang === 'ko' ? 'KO' : lang === 'ja' ? 'JA' : 'EN'}
                <ChevronDown size={10} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-md shadow-lg overflow-hidden z-50 min-w-[120px]">
                  <Link href="/" className={`block px-4 py-2 text-xs hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors ${lang === 'ko' ? 'font-bold text-[#24292f] dark:text-[#e6edf3]' : 'text-[#57606a] dark:text-[#8b949e]'}`} onClick={() => setLangOpen(false)}>KO 한국어</Link>
                  <Link href="/en" className={`block px-4 py-2 text-xs hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors ${lang === 'en' ? 'font-bold text-[#24292f] dark:text-[#e6edf3]' : 'text-[#57606a] dark:text-[#8b949e]'}`} onClick={() => setLangOpen(false)}>EN English</Link>
                  <Link href="/ja" className={`block px-4 py-2 text-xs hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors ${lang === 'ja' ? 'font-bold text-[#24292f] dark:text-[#e6edf3]' : 'text-[#57606a] dark:text-[#8b949e]'}`} onClick={() => setLangOpen(false)}>JA 日本語</Link>
                </div>
              )}
            </div>
            {/* Desktop CTA */}
            <Link href="/app" className="hidden md:flex items-center gap-1.5 bg-[#000] hover:bg-[#333] dark:bg-white dark:hover:bg-[#eee] dark:text-black text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors">
              {t.nav_cta} <ChevronRight size={14} />
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#57606a] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] rounded-md transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] px-6 py-4 flex flex-col gap-3">
            <Link href={t.nav_blog_href} onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors py-1">
              {t.nav_blog}
            </Link>
            <Link href="/app" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 bg-[#000] hover:bg-[#333] dark:bg-white dark:hover:bg-[#eee] dark:text-black text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors">
              {t.nav_cta} <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-[#000] dark:bg-[#000] text-white overflow-hidden">
        {/* dot grid background */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 md:pt-32 md:pb-36 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60 border border-white/20 px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-[#2da44e] rounded-full" />
            {t.hero_badge}
          </span>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none whitespace-pre-line mb-6 text-white">
            {t.hero_title}
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-12">
            {t.hero_sub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/app"
              className="flex items-center gap-2 bg-white hover:bg-[#eee] text-black font-bold text-base px-7 py-3.5 rounded-md transition-colors">
              <Zap size={18} fill="currentColor" />
              {t.hero_cta}
            </Link>
            <a href="#features" className="text-white/50 hover:text-white/80 font-medium text-sm transition-colors flex items-center gap-1">
              {t.hero_sub_cta} <ChevronRight size={14} />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
            {t.stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-5 bg-white/5 backdrop-blur-sm">
                <span className="text-2xl font-black text-white">{s.val}</span>
                <span className="text-xs text-white/50 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ── */}
      <section className="border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-center mb-12">
            {t.why_title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.why_items.map((w, i) => (
              <div key={i} className="p-6 border border-[#d0d7de] dark:border-[#30363d] rounded-xl hover:border-[#000] dark:hover:border-white transition-colors group">
                <div className="w-8 h-8 bg-[#000] dark:bg-white rounded-md flex items-center justify-center mb-4">
                  <span className="text-white dark:text-black font-black text-sm">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="font-bold text-[#24292f] dark:text-[#e6edf3] mb-2">{w.title}</h3>
                <p className="text-sm text-[#57606a] dark:text-[#8b949e] leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-3">{t.features_title}</h2>
            <p className="text-[#57606a] dark:text-[#8b949e] text-base max-w-xl mx-auto">{t.features_sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const copy = lang === 'ko' ? f.ko : lang === 'ja' ? f.ja : f.en;
              return (
                <Link key={i} href="/app"
                  className="group flex items-start gap-4 p-5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl hover:border-[#000] dark:hover:border-white transition-colors">
                  <div className="w-8 h-8 rounded-md bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] flex items-center justify-center shrink-0 text-[#24292f] dark:text-[#e6edf3] group-hover:bg-black group-hover:text-white group-hover:border-black dark:group-hover:bg-white dark:group-hover:text-black dark:group-hover:border-white transition-colors">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#24292f] dark:text-[#e6edf3] mb-1">{copy.title}</h3>
                    <p className="text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed">{copy.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-center mb-16">
            {t.how_title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-[#d0d7de] dark:bg-[#30363d]" />
            {t.how_steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full border-2 border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex items-center justify-center mb-6 relative z-10">
                  <span className="font-black text-lg text-[#24292f] dark:text-[#e6edf3]">{step.num}</span>
                </div>
                <h3 className="font-bold text-[#24292f] dark:text-[#e6edf3] text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-[#57606a] dark:text-[#8b949e] leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-center mb-12">{t.pricing_title}</h2>
          <div className="max-w-md mx-auto">
            <div className="bg-[#000] dark:bg-[#000] rounded-xl p-8 text-white relative overflow-hidden border border-[#333]">
              {/* subtle grid */}
              <div className="absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50 border border-white/20 px-3 py-1 rounded-full">{t.pricing_free_name}</span>
                  <Zap size={20} fill="currentColor" className="text-white/30" />
                </div>
                <div className="text-5xl font-black mb-1">{t.pricing_free_price}</div>
                <p className="text-white/50 text-sm mb-8">{t.pricing_free_sub}</p>
                <ul className="space-y-3 mb-8">
                  {t.pricing_free_features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle size={15} className="text-[#2da44e] shrink-0" />
                      <span className="text-white/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/app"
                  className="block w-full bg-white hover:bg-[#eee] text-black font-bold py-3 rounded-md transition-colors text-center text-sm">
                  {t.pricing_cta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Chat ── */}
      <section id="chat" className="border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#57606a] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d] px-4 py-1.5 rounded-full mb-4">
              <MessageCircle size={13} />
              {t.chat_title}
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">{t.chat_title}</h2>
            <p className="text-[#57606a] dark:text-[#8b949e] text-sm">{t.chat_sub}</p>
          </div>
          <LandingChat t={t} />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-center mb-12">{t.faq_title}</h2>
          <FAQ items={t.faqs} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-[#000] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-3">{t.cta_title}</h2>
          <p className="text-white/50 text-sm font-medium mb-10">{t.cta_sub}</p>
          <Link href="/app"
            className="inline-flex items-center gap-2 bg-white hover:bg-[#eee] text-black font-bold text-base px-8 py-3.5 rounded-md transition-colors">
            <Zap size={18} fill="currentColor" />
            {t.cta_btn}
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2 font-black text-[#24292f] dark:text-[#e6edf3]">
              <Zap size={18} fill="currentColor" />
              GrowWeb.me
            </div>
            <nav className="flex items-center gap-6 text-xs font-medium text-[#57606a] dark:text-[#8b949e]">
              <a href="#features" className="hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">{t.nav_features}</a>
              <a href="#pricing" className="hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">{t.nav_pricing}</a>
              <a href="#faq" className="hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">{t.nav_faq}</a>
              <Link href="/privacy" className="hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors">{t.footer_privacy}</Link>
            </nav>
          </div>
          <div className="text-center text-[11px] text-[#57606a] dark:text-[#8b949e] border-t border-[#d0d7de] dark:border-[#30363d] pt-6">
            {t.footer_copy}
          </div>
        </div>
      </footer>
    </div>
  );
}
