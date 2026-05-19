'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Trash2, ExternalLink, RefreshCw, Plus, Globe, Pencil, X, Clock, ChevronDown, ChevronUp, Zap, Share2, Copy, Check } from 'lucide-react';
import type { PostIndex, BlogPost } from '@/app/api/blog/generate/route';
import type { ScheduleConfig } from '@/app/api/blog/schedule/route';

type Lang = 'ko' | 'en' | 'ja';

interface Props {
  onToast: (msg: string) => void;
}

const INTERVAL_OPTIONS = [
  { value: 24, label: '24시간마다' },
  { value: 48, label: '48시간마다' },
  { value: 72, label: '72시간마다' },
  { value: 168, label: '1주일마다' },
];

const BULK_START = '2025-01-10';
const BULK_END = new Date().toISOString().split('T')[0];

// 150 evenly-spaced slots; KO = i%3===0, EN = i%3===1, JA = i%3===2 (50 each, no overlap)
function assignBulkDates(lang: Lang): string[] {
  const startMs = new Date(BULK_START).getTime();
  const endMs = new Date(BULK_END).getTime();
  const totalDays = Math.floor((endMs - startMs) / 86400000);
  const slots = Array.from({ length: 150 }, (_, i) => {
    const d = new Date(startMs + Math.round(i * totalDays / 149) * 86400000);
    return d.toISOString().split('T')[0];
  });
  const mod = lang === 'ko' ? 0 : lang === 'en' ? 1 : 2;
  return slots.filter((_, i) => i % 3 === mod);
}

const KO_DEFAULT_KEYWORDS = `스타트업 랜딩페이지 GEO 최적화 체크리스트
1인 마케터 GA4 자동 리포트 만드는 법
ChatGPT로 블로그 콘텐츠 자동화하는 단계별 방법
GA4 이탈률 높은 페이지 찾아서 수정하는 법
Google Search Console로 노출 키워드 찾는 법
AI 검색(ChatGPT·Perplexity)에 내 사이트 노출시키는 법
마케팅 예산 월 100만 원으로 SEO 시작하는 방법
1인 마케터가 혼자 운영하는 SEO 블로그 전략
소규모 쇼핑몰 상품 페이지 SEO 최적화 실전 가이드
스타트업 콘텐츠 마케팅 3개월 로드맵
GA4 전환 이벤트 설정하는 법 초보자 가이드
네이버 블로그 vs 티스토리 vs 자체 블로그 SEO 비교
AI 검색 시대에 살아남는 콘텐츠 전략
구글 SGE에서 내 사이트가 인용되는 조건
페르소나 기반 콘텐츠 캘린더 만드는 법
SNS 없이 블로그만으로 월 1만 방문자 만드는 법
롱테일 키워드로 경쟁 없이 구글 상위 노출하는 법
B2B SaaS 콘텐츠 마케팅 월 50만 원 예산으로 시작하기
GA4 세션 소스 매체 분석으로 유입 채널 최적화하기
클릭률 낮은 구글 검색 결과 제목·설명 개선하는 법
중소기업 SEO 담당자가 혼자 할 수 있는 기술 SEO 체크리스트
AI로 키워드 리서치 10배 빠르게 하는 방법
퍼포먼스 마케팅과 콘텐츠 마케팅 비용 대비 효과 비교
소셜미디어 없이 오가닉 트래픽 늘리는 6가지 방법
신규 스타트업 도메인 권위 빠르게 높이는 백링크 전략
이탈률 70% 이상인 랜딩페이지 개선 체크리스트
마케터를 위한 파이썬 없이 데이터 분석하는 법
구글 애즈 없이 전환율 높이는 SEO CRO 통합 전략
AI 작성 블로그 글 품질 높이는 편집 프레임워크
주간 마케팅 리포트 자동화하는 노코드 방법
Search Console 데이터로 콘텐츠 업데이트 우선순위 정하는 법
스타트업 브랜드 검색 점유율 높이는 GEO 전략
마케팅 자동화로 1인이 5인 역할 하는 워크플로우
Core Web Vitals 개선으로 SEO 순위 올리는 실전 가이드
AI 검색 시대 제로 클릭 검색 대응 콘텐츠 전략
리타겟팅 없이 이메일로 재방문율 높이는 방법
인하우스 마케터가 에이전시 없이 SEO 감사하는 법
GA4 맞춤 대시보드 만드는 법 초보자 완전 정복
블로그 포스트 하나로 여러 채널 콘텐츠 만드는 리퍼포징 전략
중소기업 유튜브 SEO 최적화로 오가닉 유입 늘리는 법`;

const JA_DEFAULT_KEYWORDS = `スタートアップのランディングページGEO最適化チェックリスト
一人マーケターのGA4自動レポート作成方法
ChatGPTでブログコンテンツを自動化するステップバイステップガイド
GA4で直帰率の高いページを見つけて改善する方法
Google Search Consoleで流入キーワードを発見する方法
ChatGPT・PerplexityなどAI検索に自社サイトを表示させる方法
月10万円以下の予算でSEOを始めるスタートアップ向けガイド
一人マーケターが運営するSEOブログ戦略の実践
小規模ECサイトの商品ページSEO最適化実践ガイド
スタートアップのコンテンツマーケティング3ヶ月ロードマップ
GA4コンバージョンイベント設定方法 初心者向け完全ガイド
AI検索時代を生き抜くコンテンツ戦略
GoogleのSGEで自社サイトが引用される条件とは
ペルソナベースのコンテンツカレンダー作成方法
SNSなしでブログだけで月1万訪問者を達成する方法
ロングテールキーワードで競合なしにGoogle上位表示する方法
GA4セッションソース・メディア分析で流入チャネルを最適化する
クリック率の低い検索結果のタイトルと説明を改善する方法
中小企業のSEO担当者が一人でできるテクニカルSEOチェックリスト
AIを使ってキーワードリサーチを10倍速くする方法
オーガニックトラフィックを増やす6つの方法 SNS不要
新規ドメインの権威を素早く高めるバックリンク戦略
直帰率70%以上のランディングページ改善チェックリスト
AIが書いたブログ記事の品質を高める編集フレームワーク
Search Consoleデータでコンテンツ更新の優先順位を決める方法
スタートアップのブランド検索シェアを高めるGEO戦略
マーケティング自動化で一人が5人分の仕事をするワークフロー
Core Web Vitals改善でSEO順位を上げる実践ガイド
AI検索時代のゼロクリック検索対応コンテンツ戦略
インハウスマーケターがエージェンシーなしでSEO監査する方法`;

const EN_DEFAULT_KEYWORDS = `How to get your website cited in ChatGPT and Perplexity answers
Step-by-step GEO optimization checklist for startup landing pages
How to reduce bounce rate on your landing page without paid ads
GA4 tutorial for solo marketers building automated reports
How to find low-competition keywords using Google Search Console
Content marketing strategy for B2B SaaS with a small budget
How to rank on Google without backlinks using long-tail keywords
Technical SEO audit checklist you can do without a developer
How to repurpose one blog post into 10 pieces of content
Startup SEO roadmap for the first 90 days with no budget
How to track conversions in GA4 step by step for beginners
AI search optimization vs traditional SEO what's different
How to get featured in Google's AI Overviews and SGE results
Zero-click search strategy how to win traffic without clicks
How to build domain authority for a new website from scratch
Solo marketer's guide to doing SEO without an agency
How to set up GA4 custom dashboards for weekly reporting
Longtail keyword strategy that beats high-competition terms
How to improve click-through rate on Google search results
Core Web Vitals fixes that actually improve your Google rankings
Email list building without social media using SEO content
How to do a content gap analysis using free tools
Conversion rate optimization checklist for landing pages under 1000 visitors
How to use GA4 source medium report to cut wasted ad spend
Blog content calendar template based on buyer personas
How to measure content marketing ROI without expensive tools
Link building tactics for small businesses with no outreach budget
How to optimize product pages for AI search engines
Marketing automation workflows for a one-person marketing team
Startup growth hacking with organic content instead of paid ads`;

const inputCls = 'w-full px-3 py-2 text-sm border border-[#d0d7de] dark:border-[#30363d] rounded-md bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:border-[#57606a] dark:focus:border-[#8b949e]';

export default function BlogAdminModule({ onToast }: Props) {
  const [lang, setLang] = useState<Lang>('ko');
  const [keyword, setKeyword] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [postDate, setPostDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<PostIndex[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  // Edit state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Schedule state — per-lang
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleLang, setScheduleLang] = useState<Lang>('ko');
  const [schedules, setSchedules] = useState<Partial<Record<Lang, ScheduleConfig>>>({});
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [keywordsTexts, setKeywordsTexts] = useState<Record<Lang, string>>({ ko: '', en: '', ja: '' });
  const [testPublishing, setTestPublishing] = useState(false);

  // Export state
  const [exportMenu, setExportMenu] = useState<{ slug: string } | null>(null);
  const [publishingMedium, setPublishingMedium] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [mediumTokenOk, setMediumTokenOk] = useState<boolean | null>(null);

  // Bulk state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLang, setBulkLang] = useState<Lang>('ko');
  const [bulkKeywordsText, setBulkKeywordsText] = useState(KO_DEFAULT_KEYWORDS);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [bulkErrors, setBulkErrors] = useState(0);
  const [bulkCurrentKeyword, setBulkCurrentKeyword] = useState('');
  const [bulkFailedKeywords, setBulkFailedKeywords] = useState<string[]>([]);
  const stopRef = useRef(false);

  const fetchPosts = async (l: Lang) => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/blog/posts?lang=${l}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchSchedule = async (l: Lang) => {
    setScheduleLoading(true);
    try {
      const res = await fetch(`/api/blog/schedule?lang=${l}`);
      const data: ScheduleConfig = await res.json();
      setSchedules((prev) => ({ ...prev, [l]: data }));
      setKeywordsTexts((prev) => ({ ...prev, [l]: data.keywords.join('\n') }));
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => { fetchPosts(lang); }, [lang]);

  useEffect(() => {
    if (!exportMenu) return;
    const close = () => setExportMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [exportMenu]);
  useEffect(() => {
    if (scheduleOpen && !schedules.ko) {
      fetchSchedule('ko');
      fetchSchedule('en');
      fetchSchedule('ja');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleOpen]);
  useEffect(() => {
    if (!bulkRunning) {
      setBulkKeywordsText(bulkLang === 'ko' ? KO_DEFAULT_KEYWORDS : bulkLang === 'ja' ? JA_DEFAULT_KEYWORDS : EN_DEFAULT_KEYWORDS);
    }
  }, [bulkLang]);

  const handleGenerate = async () => {
    if (!keyword.trim()) { onToast('키워드를 입력해주세요.'); return; }
    setGenerating(true);
    setPreview(null);
    try {
      const body: Record<string, string> = { keyword, targetAudience, tone, lang };
      if (postDate) body.createdAt = new Date(postDate).toISOString();
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.post);
      onToast('포스트가 생성되었습니다!');
      fetchPosts(lang);
    } catch (e) {
      onToast('오류: ' + (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`"${slug}" 포스트를 삭제할까요?`)) return;
    setDeletingSlug(slug);
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, lang }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onToast('삭제되었습니다.');
      fetchPosts(lang);
      if (preview?.slug === slug) setPreview(null);
    } catch (e) {
      onToast('삭제 오류: ' + (e as Error).message);
    } finally {
      setDeletingSlug(null);
    }
  };

  const handleEditOpen = async (slug: string) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/blog/posts/${slug}?lang=${lang}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingPost(data.post);
    } catch (e) {
      onToast('불러오기 오류: ' + (e as Error).message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingPost) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editingPost.slug, lang: editingPost.lang,
          title: editingPost.title, metaDescription: editingPost.metaDescription,
          tags: editingPost.tags, content: editingPost.content, faq: editingPost.faq,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      onToast('저장되었습니다.');
      setEditingPost(null);
      fetchPosts(lang);
    } catch (e) {
      onToast('저장 오류: ' + (e as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleScheduleSave = async () => {
    const schedule = schedules[scheduleLang];
    if (!schedule) return;
    setSavingSchedule(true);
    try {
      const keywords = keywordsTexts[scheduleLang].split('\n').map((k) => k.trim()).filter(Boolean);
      const res = await fetch(`/api/blog/schedule?lang=${scheduleLang}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...schedule, keywords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSchedules((prev) => ({ ...prev, [scheduleLang]: data }));
      onToast('자동 발행 설정이 저장되었습니다.');
    } catch (e) {
      onToast('저장 오류: ' + (e as Error).message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleTestPublish = async () => {
    setTestPublishing(true);
    try {
      const res = await fetch(`/api/blog/cron?lang=${scheduleLang}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onToast(`테스트 발행 완료! 포스트: ${data.slug}`);
      fetchPosts(scheduleLang);
      fetchSchedule(scheduleLang);
    } catch (e) {
      onToast('테스트 발행 오류: ' + (e as Error).message);
    } finally {
      setTestPublishing(false);
    }
  };

  const handleMediumPublish = async (slug: string) => {
    setPublishingMedium(slug);
    setExportMenu(null);
    try {
      const res = await fetch('/api/blog/medium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onToast(`Medium 발행 완료! ${data.url}`);
      window.open(data.url, '_blank');
    } catch (e) {
      onToast('Medium 발행 오류: ' + (e as Error).message);
    } finally {
      setPublishingMedium(null);
    }
  };

  const checkMediumToken = async () => {
    try {
      const res = await fetch('/api/blog/medium/status');
      const data = await res.json();
      setMediumTokenOk(!!data.ok);
    } catch {
      setMediumTokenOk(false);
    }
  };

  const handleCopyExport = async (slug: string, platform: 'note' | 'brunch' | 'naver') => {
    setExportMenu(null);
    try {
      const res = await fetch(`/api/blog/posts/${slug}?lang=${lang}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const post = data.post;
      const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://growweb.me';
      const canonicalUrl = `${SITE_URL}/blog/${lang}/${slug}`;
      let text = '';
      const siteUrl = 'https://growweb.me';
      const footer_ko = `\n\n---\n\n원문: ${canonicalUrl}\nGrowWeb.me — AI 마케팅 무료 진단 도구 (${siteUrl})`;
      const footer_en = `\n\n---\n\nOriginally published at GrowWeb.me: ${canonicalUrl}`;
      const footer_ja = `\n\n---\n\n原文: ${canonicalUrl}\nGrowWeb.me — 無料AIマーケティング診断ツール (${siteUrl})`;
      const footer = lang === 'en' ? footer_en : lang === 'ja' ? footer_ja : footer_ko;

      if (platform === 'naver') {
        // 네이버 블로그: 제목 + 요약 + 핵심 포인트 + 원문 링크 형식
        const summary = post.metaDescription || post.content.replace(/[#*`>\-\[\]()]/g, '').slice(0, 200);
        const tags = (post.tags || []).map((t: string) => `#${t}`).join(' ');
        text = `📌 ${post.title}\n\n${summary}\n\n👉 전문 보기: ${canonicalUrl}\n\n${tags}\n\n---\n✅ GrowWeb.me — SEO·GEO·AI 마케팅 실전 가이드 (매일 업데이트)`;
      } else if (platform === 'note') {
        text = `# ${post.title}\n\n${post.content}${footer}`;
      } else {
        text = `# ${post.title}\n\n${post.content}${footer}`;
      }
      await navigator.clipboard.writeText(text);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
      const label = platform === 'naver' ? '네이버 블로그' : platform === 'note' ? 'note.com' : '브런치';
      onToast(`${label} 내보내기 복사 완료!`);
    } catch (e) {
      onToast('복사 오류: ' + (e as Error).message);
    }
  };

  const handleBulkStart = async () => {
    const keywords = bulkKeywordsText.split('\n').map((k) => k.trim()).filter(Boolean);
    if (keywords.length === 0) { onToast('키워드를 입력해주세요.'); return; }
    const dates = assignBulkDates(bulkLang).slice(0, keywords.length);
    stopRef.current = false;
    setBulkRunning(true);
    setBulkDone(0);
    setBulkErrors(0);
    setBulkFailedKeywords([]);
    setBulkTotal(keywords.length);
    const failed: string[] = [];

    for (let i = 0; i < keywords.length; i++) {
      if (stopRef.current) break;
      setBulkCurrentKeyword(keywords[i]);
      try {
        const res = await fetch('/api/blog/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: keywords[i],
            targetAudience: bulkLang === 'ko' ? '마케터, 사업주' : bulkLang === 'ja' ? 'マーケター、経営者' : 'marketers, business owners',
            tone: bulkLang === 'ko' ? '전문적이고 실용적인' : bulkLang === 'ja' ? 'プロフェッショナルで実践的' : 'professional and practical',
            lang: bulkLang,
            createdAt: dates[i] + 'T00:00:00.000Z',
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'unknown error');
        }
      } catch (e) {
        failed.push(keywords[i]);
        setBulkErrors((prev) => prev + 1);
        console.error(`[bulk] failed: ${keywords[i]}`, (e as Error).message);
      }
      setBulkDone((prev) => prev + 1);
      if (i < keywords.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }

    setBulkFailedKeywords(failed);
    setBulkRunning(false);
    setBulkCurrentKeyword('');
    fetchPosts(lang);
    onToast(stopRef.current ? '대량 생성이 중지되었습니다.' : `대량 생성 완료! (오류 ${failed.length}건)`);
  };

  const toneOptions = lang === 'ko'
    ? ['전문적이고 실용적인', '친근하고 쉬운', '격식체', '캐주얼']
    : lang === 'ja'
    ? ['プロフェッショナルで実践的', '親しみやすく分かりやすい', '格式体', 'カジュアル']
    : ['Professional and practical', 'Friendly and accessible', 'Formal', 'Casual'];

  const bulkProgress = bulkTotal > 0 ? Math.round((bulkDone / bulkTotal) * 100) : 0;
  const bulkDates = assignBulkDates(bulkLang);
  const bulkKeywords = bulkKeywordsText.split('\n').map((k) => k.trim()).filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#24292f] dark:text-[#e6edf3]">Blog 관리</h2>
        <p className="text-sm text-[#57606a] dark:text-[#8b949e] mt-1">AI로 SEO 최적화 블로그 포스트를 자동 생성하세요.</p>
      </div>

      {/* Lang tabs */}
      <div className="flex gap-0 border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden w-fit">
        {(['ko', 'en', 'ja'] as Lang[]).map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${lang === l ? 'bg-[#000000] text-white' : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}
          >
            <Globe size={14} />
            {l === 'ko' ? '국문 (KO)' : l === 'ja' ? '일문 (JA)' : '영문 (EN)'}
          </button>
        ))}
      </div>

      {/* Manual generate form */}
      <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-6 bg-white dark:bg-[#161b22]">
        <h3 className="font-semibold text-[#24292f] dark:text-[#e6edf3] mb-4 flex items-center gap-2">
          <Plus size={16} />
          {lang === 'ko' ? '국문 포스트 생성' : lang === 'ja' ? '日本語記事を生成' : 'Generate English Post'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
              키워드 / Keyword <span className="text-red-500">*</span>
            </label>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder={lang === 'ko' ? 'AI 마케팅 전략' : lang === 'ja' ? 'AIマーケティング戦略' : 'AI marketing strategy'} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
              {lang === 'ko' ? '대상 독자' : 'Target Audience'}
            </label>
            <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
              placeholder={lang === 'ko' ? '스타트업 마케터' : lang === 'ja' ? 'スタートアップマーケター' : 'Startup marketers'} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
              발행일 <span className="font-normal text-[#8b949e]">(비워두면 오늘)</span>
            </label>
            <input type="date" value={postDate} onChange={(e) => setPostDate(e.target.value)}
              min="2020-01-01" max="2030-12-31" className={inputCls} />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
            {lang === 'ko' ? '톤앤매너' : 'Tone'}
          </label>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((t) => (
              <button key={t} onClick={() => setTone(tone === t ? '' : t)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${tone === t ? 'bg-[#000000] text-white border-[#000000]' : 'border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:border-[#57606a]'}`}
              >{t}</button>
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-[#000000] hover:bg-[#333333] disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {generating ? (lang === 'ko' ? '생성 중... (10~20초)' : 'Generating... (10~20s)') : (lang === 'ko' ? 'AI 포스트 생성' : 'Generate with AI')}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-6 bg-white dark:bg-[#161b22]">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">
              {lang === 'ko' ? '생성 완료 — 미리보기' : 'Generated — Preview'}
            </h3>
            <a href={`/blog/${lang}/${preview.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] transition-colors"
            >
              <ExternalLink size={13} />
              {lang === 'ko' ? '블로그에서 보기' : 'View on blog'}
            </a>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">제목</span>
              <p className="font-medium text-[#24292f] dark:text-[#e6edf3]">{preview.title}</p>
            </div>
            <div>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">Meta Description</span>
              <p className="text-sm text-[#57606a] dark:text-[#8b949e]">{preview.metaDescription}</p>
            </div>
            <div>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">태그</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {preview.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-[#f6f8fa] dark:bg-[#21262d] text-xs text-[#57606a] dark:text-[#8b949e] rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e]">본문 미리보기</span>
              <p className="text-sm text-[#24292f] dark:text-[#e6edf3] mt-1 line-clamp-4 bg-[#f6f8fa] dark:bg-[#21262d] p-3 rounded-md font-mono leading-relaxed">
                {preview.content.slice(0, 300)}...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk generation accordion */}
      <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden bg-white dark:bg-[#161b22]">
        <button
          onClick={() => setBulkOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-[#24292f] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Zap size={16} />
            대량 생성 (백데이팅)
            <span className="text-xs font-normal text-[#57606a] dark:text-[#8b949e]">국문·영문·일문 각 50개, 2025.01~2026.05</span>
          </span>
          {bulkOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {bulkOpen && (
          <div className="px-6 pb-6 border-t border-[#d0d7de] dark:border-[#30363d] pt-5 space-y-4">
            {/* Bulk lang tabs */}
            <div className="flex gap-0 border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden w-fit">
              {(['ko', 'en', 'ja'] as Lang[]).map((l) => (
                <button key={l} onClick={() => !bulkRunning && setBulkLang(l)} disabled={bulkRunning}
                  className={`px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed ${bulkLang === l ? 'bg-[#000000] text-white' : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}
                >
                  <Globe size={14} />
                  {l === 'ko' ? '국문 50개' : l === 'ja' ? '일문 50개' : '영문 50개'}
                </button>
              ))}
            </div>

            {/* Keywords textarea */}
            <div>
              <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
                키워드 목록 (한 줄에 하나) — {bulkKeywords.length}개
              </label>
              <textarea
                value={bulkKeywordsText}
                onChange={(e) => setBulkKeywordsText(e.target.value)}
                disabled={bulkRunning}
                rows={10}
                className={`${inputCls} resize-y font-mono text-xs leading-6 disabled:opacity-60`}
              />
            </div>

            {/* Date preview */}
            <div className="text-xs text-[#57606a] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] rounded-md p-3">
              <p className="font-medium mb-1">날짜 배분 미리보기 (균등 배분, 중복 없음)</p>
              <p>첫 번째 글: <strong>{bulkDates[0]}</strong> &nbsp;|&nbsp; 마지막 글: <strong>{bulkDates[Math.min(bulkKeywords.length - 1, 49)]}</strong></p>
              <p>간격: 약 10일 (국문·영문·일문 날짜 겹침 없음)</p>
            </div>

            {/* Progress */}
            {(bulkRunning || bulkDone > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#57606a] dark:text-[#8b949e]">
                  <span>{bulkDone} / {bulkTotal} 완료 {bulkErrors > 0 && <span className="text-red-500">({bulkErrors}건 오류)</span>}</span>
                  <span>{bulkProgress}%</span>
                </div>
                <div className="w-full bg-[#eaeef2] dark:bg-[#30363d] rounded-full h-2">
                  <div className="bg-[#000000] h-2 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }} />
                </div>
                {bulkCurrentKeyword && (
                  <p className="text-xs text-[#57606a] dark:text-[#8b949e]">생성 중: <span className="font-medium">{bulkCurrentKeyword}</span></p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {!bulkRunning ? (
                <button onClick={handleBulkStart}
                  className="flex items-center gap-2 px-4 py-2 bg-[#000000] hover:bg-[#333333] text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Zap size={14} />
                  대량 생성 시작 ({bulkKeywords.length}개)
                </button>
              ) : (
                <button onClick={() => { stopRef.current = true; }}
                  className="flex items-center gap-2 px-4 py-2 border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:border-red-500 hover:text-red-500 text-sm font-medium rounded-md transition-colors"
                >
                  <X size={14} />
                  중지
                </button>
              )}
              {bulkDone > 0 && !bulkRunning && (
                <span className="text-xs text-[#57606a] dark:text-[#8b949e]">
                  완료 — 포스트 목록을 새로고침하세요
                </span>
              )}
            </div>

            <p className="text-xs text-[#57606a] dark:text-[#8b949e]">
              ⚠ 생성 중 페이지를 닫으면 중단됩니다. 국문·영문 각각 순차 실행하세요. 소요 시간: 약 15~25분/50개
            </p>
          </div>
        )}
      </div>

      {/* Auto-schedule accordion */}
      <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden bg-white dark:bg-[#161b22]">
        <button
          onClick={() => setScheduleOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-[#24292f] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Clock size={16} />
            자동 발행 설정
            {(['ko', 'en', 'ja'] as Lang[]).filter((l) => schedules[l]?.enabled).map((l) => (
              <span key={l} className="px-2 py-0.5 bg-[#000000] text-white text-xs rounded-full">
                {l.toUpperCase()} ON
              </span>
            ))}
          </span>
          {scheduleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {scheduleOpen && (
          <div className="border-t border-[#d0d7de] dark:border-[#30363d]">
            {/* Language tabs */}
            <div className="flex border-b border-[#d0d7de] dark:border-[#30363d]">
              {(['ko', 'en', 'ja'] as Lang[]).map((l) => (
                <button key={l} onClick={() => setScheduleLang(l)}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${scheduleLang === l ? 'border-[#000000] text-[#24292f] dark:text-[#e6edf3]' : 'border-transparent text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}
                >
                  <Globe size={13} />
                  {l === 'ko' ? '국문' : l === 'en' ? '영문' : '일문'}
                  {schedules[l]?.enabled && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </button>
              ))}
            </div>

            <div className="px-6 pb-6 pt-5">
              {scheduleLoading && !schedules[scheduleLang] ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-[#57606a]" /></div>
              ) : (() => {
                const schedule = schedules[scheduleLang];
                if (!schedule) return <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-[#57606a]" /></div>;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3]">
                          {scheduleLang === 'ko' ? '국문' : scheduleLang === 'en' ? '영문' : '일문'} 자동 발행 활성화
                        </p>
                        <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">매일 자정(UTC)에 실행 — 설정한 주기 도달 시 발행</p>
                      </div>
                      <button
                        onClick={() => setSchedules((prev) => ({ ...prev, [scheduleLang]: { ...schedule, enabled: !schedule.enabled } }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${schedule.enabled ? 'bg-[#000000]' : 'bg-[#d0d7de] dark:bg-[#30363d]'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${schedule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">발행 주기</label>
                        <select
                          value={schedule.intervalHours}
                          onChange={(e) => setSchedules((prev) => ({ ...prev, [scheduleLang]: { ...schedule, intervalHours: Number(e.target.value) } }))}
                          className={inputCls}
                        >
                          {INTERVAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">대상 독자</label>
                        <input type="text"
                          value={schedule.targetAudience}
                          onChange={(e) => setSchedules((prev) => ({ ...prev, [scheduleLang]: { ...schedule, targetAudience: e.target.value } }))}
                          placeholder={scheduleLang === 'ko' ? '마케터, 사업주' : scheduleLang === 'ja' ? 'マーケター、経営者' : 'marketers, business owners'}
                          className={inputCls}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">톤앤매너</label>
                        <input type="text"
                          value={schedule.tone}
                          onChange={(e) => setSchedules((prev) => ({ ...prev, [scheduleLang]: { ...schedule, tone: e.target.value } }))}
                          placeholder={scheduleLang === 'ko' ? '전문적이고 실용적인' : scheduleLang === 'ja' ? 'プロフェッショナルで実践的' : 'professional and practical'}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
                        키워드 목록 (한 줄에 하나) — {keywordsTexts[scheduleLang].split('\n').filter((k) => k.trim()).length}개
                      </label>
                      <textarea
                        value={keywordsTexts[scheduleLang]}
                        onChange={(e) => setKeywordsTexts((prev) => ({ ...prev, [scheduleLang]: e.target.value }))}
                        rows={6}
                        placeholder={scheduleLang === 'ko' ? 'AI 마케팅 전략\nSEO 최적화 방법\nGEO 최적화란' : scheduleLang === 'ja' ? 'AIマーケティング戦略\nSEO最適化方法' : 'AI marketing strategy\nSEO optimization guide'}
                        className={`${inputCls} resize-none font-mono`}
                      />
                    </div>
                    {schedule.lastRunAt && (
                      <div className="text-xs text-[#57606a] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] rounded-md p-3 space-y-1">
                        <p>마지막 발행: {new Date(schedule.lastRunAt).toLocaleString('ko-KR')}</p>
                        {schedule.nextRunAt && <p>다음 발행 예정: {new Date(schedule.nextRunAt).toLocaleString('ko-KR')}</p>}
                        <p>다음 키워드: {schedule.keywords[schedule.currentKeywordIndex % Math.max(schedule.keywords.length, 1)] || '—'}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <button onClick={handleScheduleSave} disabled={savingSchedule}
                        className="flex items-center gap-2 px-4 py-2 bg-[#000000] hover:bg-[#333333] disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        {savingSchedule ? <Loader2 size={14} className="animate-spin" /> : null}
                        설정 저장
                      </button>
                      <button onClick={handleTestPublish} disabled={testPublishing || savingSchedule}
                        className="flex items-center gap-2 px-4 py-2 border border-[#d0d7de] dark:border-[#30363d] hover:border-[#000000] dark:hover:border-[#e6edf3] text-[#24292f] dark:text-[#e6edf3] disabled:opacity-50 text-sm font-medium rounded-md transition-colors"
                      >
                        {testPublishing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                        테스트 발행 (즉시 1건)
                      </button>
                    </div>
                    <p className="text-xs text-[#57606a] dark:text-[#8b949e]">
                      테스트 발행은 설정을 저장한 뒤 키워드 목록의 다음 순서 키워드로 즉시 글을 생성합니다.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Post list */}
      <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-visible bg-white dark:bg-[#161b22]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] rounded-t-lg">
          <span className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3]">
            {lang === 'ko' ? `국문 포스트 (${posts.length})` : lang === 'ja' ? `日本語記事 (${posts.length})` : `English Posts (${posts.length})`}
          </span>
          <button onClick={() => fetchPosts(lang)} className="p-1.5 text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] transition-colors">
            <RefreshCw size={14} className={loadingPosts ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingPosts ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#57606a]" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-[#57606a] dark:text-[#8b949e] text-sm">
            {lang === 'ko' ? '아직 포스트가 없습니다.' : 'No posts yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#d0d7de] dark:border-[#30363d] text-xs text-[#57606a] dark:text-[#8b949e]">
                <th className="text-left px-5 py-2 font-medium">{lang === 'ko' ? '제목' : 'Title'}</th>
                <th className="text-left px-3 py-2 font-medium hidden md:table-cell">{lang === 'ko' ? '키워드' : 'Keyword'}</th>
                <th className="text-left px-3 py-2 font-medium hidden md:table-cell">{lang === 'ko' ? '날짜' : 'Date'}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.slug} className="border-b border-[#d0d7de] dark:border-[#30363d] last:border-0 hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors">
                  <td className="px-5 py-3">
                    <a href={`/blog/${lang}/${post.slug}`} target="_blank" rel="noopener noreferrer"
                      className="font-medium text-[#24292f] dark:text-[#e6edf3] hover:underline line-clamp-1"
                    >{post.title}</a>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.tags.slice(0, 3).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] text-xs rounded">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[#57606a] dark:text-[#8b949e] hidden md:table-cell">{post.keyword}</td>
                  <td className="px-3 py-3 text-[#57606a] dark:text-[#8b949e] text-xs hidden md:table-cell whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 relative">
                      <button onClick={() => handleEditOpen(post.slug)} disabled={editLoading}
                        className="p-1.5 text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors disabled:opacity-50" title="수정"
                      >
                        {editLoading ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                      </button>
                      <button onClick={() => handleDelete(post.slug)} disabled={deletingSlug === post.slug}
                        className="p-1.5 text-[#57606a] dark:text-[#8b949e] hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50" title="삭제"
                      >
                        {deletingSlug === post.slug ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                      {/* Export trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportMenu(exportMenu?.slug === post.slug ? null : { slug: post.slug });
                        }}
                        className="p-1.5 text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors"
                        title="내보내기"
                      >
                        {publishingMedium === post.slug ? <Loader2 size={14} className="animate-spin" /> : copiedSlug === post.slug ? <Check size={14} className="text-green-500" /> : <Share2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="w-full max-w-3xl bg-white dark:bg-[#161b22] rounded-xl border border-[#d0d7de] dark:border-[#30363d] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#d0d7de] dark:border-[#30363d]">
              <h3 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">포스트 수정</h3>
              <button onClick={() => setEditingPost(null)} className="p-1 text-[#57606a] hover:text-[#24292f] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">제목</label>
                <input type="text" value={editingPost.title} onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">Meta Description</label>
                <input type="text" value={editingPost.metaDescription} onChange={(e) => setEditingPost({ ...editingPost, metaDescription: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">태그 (쉼표 구분)</label>
                <input type="text" value={editingPost.tags.join(', ')} onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">본문 (마크다운)</label>
                <textarea value={editingPost.content} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  rows={18} className={`${inputCls} resize-y font-mono text-xs leading-relaxed`} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#d0d7de] dark:border-[#30363d]">
              <button onClick={() => setEditingPost(null)} className="px-4 py-2 text-sm text-[#57606a] hover:text-[#24292f] transition-colors">취소</button>
              <button onClick={handleEditSave} disabled={savingEdit}
                className="flex items-center gap-2 px-4 py-2 bg-[#000000] hover:bg-[#333333] disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
              >
                {savingEdit ? <Loader2 size={14} className="animate-spin" /> : null}
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export bottom sheet — portal to document.body, works on all devices */}
      {exportMenu && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={() => setExportMenu(null)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-[#161b22] rounded-t-2xl shadow-2xl border-t border-[#d0d7de] dark:border-[#30363d]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#d0d7de] dark:border-[#30363d]">
              <span className="text-sm font-semibold text-[#24292f] dark:text-[#e6edf3]">배포 채널 선택</span>
              <button onClick={() => setExportMenu(null)} className="text-[#57606a] dark:text-[#8b949e]">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-3 space-y-2 pb-8">
              <button
                onClick={() => { checkMediumToken(); handleMediumPublish(exportMenu.slug); setExportMenu(null); }}
                className="w-full text-left px-4 py-3 text-sm text-[#24292f] dark:text-[#e6edf3] bg-[#f6f8fa] dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] rounded-lg flex items-center gap-3 transition-colors"
              >
                <ExternalLink size={16} className="shrink-0" />
                <span>Medium 자동 발행</span>
                {mediumTokenOk === false && <span className="ml-auto text-red-500 text-xs">토큰 미설정</span>}
              </button>
              <button
                onClick={() => { handleCopyExport(exportMenu.slug, 'naver'); setExportMenu(null); }}
                className="w-full text-left px-4 py-3 text-sm text-[#24292f] dark:text-[#e6edf3] bg-[#f6f8fa] dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] rounded-lg flex items-center gap-3 transition-colors"
              >
                <Copy size={16} className="shrink-0" />
                <span>네이버 블로그용 복사</span>
              </button>
              <button
                onClick={() => { handleCopyExport(exportMenu.slug, 'brunch'); setExportMenu(null); }}
                className="w-full text-left px-4 py-3 text-sm text-[#24292f] dark:text-[#e6edf3] bg-[#f6f8fa] dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] rounded-lg flex items-center gap-3 transition-colors"
              >
                <Copy size={16} className="shrink-0" />
                <span>브런치용 복사</span>
              </button>
              <button
                onClick={() => { handleCopyExport(exportMenu.slug, 'note'); setExportMenu(null); }}
                className="w-full text-left px-4 py-3 text-sm text-[#24292f] dark:text-[#e6edf3] bg-[#f6f8fa] dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] rounded-lg flex items-center gap-3 transition-colors"
              >
                <Copy size={16} className="shrink-0" />
                <span>note.com용 복사</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
