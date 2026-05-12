'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, ExternalLink, RefreshCw, Plus, Globe, Pencil, X, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import type { PostIndex, BlogPost } from '@/app/api/blog/generate/route';
import type { ScheduleConfig } from '@/app/api/blog/schedule/route';

type Lang = 'ko' | 'en';

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
const BULK_END = '2026-05-10';

// 100 evenly-spaced slots; KO = even indices, EN = odd indices
function assignBulkDates(lang: Lang): string[] {
  const startMs = new Date(BULK_START).getTime();
  const endMs = new Date(BULK_END).getTime();
  const totalDays = Math.floor((endMs - startMs) / 86400000);
  const slots = Array.from({ length: 100 }, (_, i) => {
    const d = new Date(startMs + Math.round(i * totalDays / 99) * 86400000);
    return d.toISOString().split('T')[0];
  });
  return slots.filter((_, i) => lang === 'ko' ? i % 2 === 0 : i % 2 !== 0);
}

const KO_DEFAULT_KEYWORDS = `AI 마케팅이란 무엇인가
AI 콘텐츠 마케팅 전략
ChatGPT 마케팅 활용법
SEO 최적화 완벽 가이드
데이터 기반 마케팅 전략
개인화 마케팅 전략 수립
GEO 최적화 완벽 가이드
검색엔진 최적화 핵심 요소
소셜미디어 마케팅 전략
콘텐츠 마케팅 ROI 측정법
AI 광고 최적화 방법
마케팅 자동화 도구 활용법
고객 세그멘테이션 전략
이메일 마케팅 성과 높이는 방법
퍼포먼스 마케팅 기초 가이드
브랜드 마케팅 전략 수립
인플루언서 마케팅 실전 가이드
B2B 마케팅 전략 완벽 정리
마케팅 퍼널 최적화 방법
키워드 리서치 완벽 가이드
롱테일 키워드 발굴 전략
백링크 구축 전략 가이드
온페이지 SEO 최적화 방법
기술적 SEO 체크리스트
로컬 SEO 마케팅 전략
음성 검색 SEO 최적화 방법
모바일 SEO 전략 가이드
AI 검색 최적화 방법
제로 클릭 검색 대응 전략
검색 의도 분석 방법
고객 여정 맵 작성 가이드
CRM 마케팅 활용 전략
리타겟팅 광고 전략 가이드
전환율 최적화 실전 방법
마케팅 예산 배분 전략
경쟁사 분석 방법 가이드
구글 애널리틱스 마케팅 활용법
마케팅 KPI 설정 방법
A/B 테스트 마케팅 적용 방법
소비자 행동 분석 방법
브랜드 스토리텔링 전략
바이럴 마케팅 성공 전략
옴니채널 마케팅 전략 가이드
커뮤니티 마케팅 실전 방법
리뷰 마케팅 활용 전략
동영상 마케팅 SEO 전략
AI 챗봇 마케팅 활용법
스타트업 마케팅 전략 가이드
마케팅 자동화 워크플로우 구축
제품 마케팅 전략 완벽 가이드`;

const EN_DEFAULT_KEYWORDS = `What is AI marketing
AI content marketing strategy guide
Using ChatGPT for business marketing
Complete SEO optimization guide
Data-driven marketing strategy
Personalized marketing tactics and examples
What is GEO optimization
Search engine optimization fundamentals
Social media marketing strategy guide
Measuring content marketing ROI
AI advertising optimization methods
Marketing automation tools comparison
Customer segmentation strategy guide
Email marketing performance tips
Performance marketing basics guide
Brand marketing strategy framework
Influencer marketing complete guide
B2B marketing strategy playbook
Marketing funnel optimization methods
Keyword research complete guide
Long-tail keyword strategy guide
Link building strategy guide
On-page SEO optimization checklist
Technical SEO audit checklist
Local SEO marketing guide
Voice search SEO optimization
Mobile SEO strategy guide
AI search optimization methods
Zero-click search strategy guide
Search intent analysis guide
Customer journey mapping guide
CRM marketing strategy guide
Retargeting advertising strategy
Conversion rate optimization methods
Marketing budget allocation strategy
Competitor analysis methods guide
Google Analytics for marketers
Marketing KPI framework guide
A/B testing in marketing guide
Consumer behavior analysis methods
Brand storytelling strategy guide
Viral marketing strategy examples
Omnichannel marketing strategy guide
Community marketing methods guide
Review marketing strategy guide
Video marketing SEO guide
AI chatbot marketing applications
Startup marketing strategy guide
Marketing automation workflow setup
Product marketing strategy guide`;

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

  // Schedule state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleConfig | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [keywordsText, setKeywordsText] = useState('');

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

  const fetchSchedule = async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch('/api/blog/schedule');
      const data: ScheduleConfig = await res.json();
      setSchedule(data);
      setKeywordsText(data.keywords.join('\n'));
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => { fetchPosts(lang); }, [lang]);
  useEffect(() => { if (scheduleOpen && !schedule) fetchSchedule(); }, [scheduleOpen]);
  useEffect(() => {
    if (!bulkRunning) setBulkKeywordsText(bulkLang === 'ko' ? KO_DEFAULT_KEYWORDS : EN_DEFAULT_KEYWORDS);
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
    if (!schedule) return;
    setSavingSchedule(true);
    try {
      const keywords = keywordsText.split('\n').map((k) => k.trim()).filter(Boolean);
      const res = await fetch('/api/blog/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...schedule, keywords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSchedule(data);
      onToast('자동 발행 설정이 저장되었습니다.');
    } catch (e) {
      onToast('저장 오류: ' + (e as Error).message);
    } finally {
      setSavingSchedule(false);
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
            targetAudience: bulkLang === 'ko' ? '마케터, 사업주' : 'marketers, business owners',
            tone: bulkLang === 'ko' ? '전문적이고 실용적인' : 'professional and practical',
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
        {(['ko', 'en'] as Lang[]).map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${lang === l ? 'bg-[#000000] text-white' : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}
          >
            <Globe size={14} />
            {l === 'ko' ? '국문 (KO)' : '영문 (EN)'}
          </button>
        ))}
      </div>

      {/* Manual generate form */}
      <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-6 bg-white dark:bg-[#161b22]">
        <h3 className="font-semibold text-[#24292f] dark:text-[#e6edf3] mb-4 flex items-center gap-2">
          <Plus size={16} />
          {lang === 'ko' ? '국문 포스트 생성' : 'Generate English Post'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
              키워드 / Keyword <span className="text-red-500">*</span>
            </label>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder={lang === 'ko' ? 'AI 마케팅 전략' : 'AI marketing strategy'} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">
              {lang === 'ko' ? '대상 독자' : 'Target Audience'}
            </label>
            <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
              placeholder={lang === 'ko' ? '스타트업 마케터' : 'Startup marketers'} className={inputCls} />
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
            <span className="text-xs font-normal text-[#57606a] dark:text-[#8b949e]">국문 50개 / 영문 50개, 2025.01~2026.05</span>
          </span>
          {bulkOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {bulkOpen && (
          <div className="px-6 pb-6 border-t border-[#d0d7de] dark:border-[#30363d] pt-5 space-y-4">
            {/* Bulk lang tabs */}
            <div className="flex gap-0 border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden w-fit">
              {(['ko', 'en'] as Lang[]).map((l) => (
                <button key={l} onClick={() => !bulkRunning && setBulkLang(l)} disabled={bulkRunning}
                  className={`px-5 py-2 text-sm font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed ${bulkLang === l ? 'bg-[#000000] text-white' : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'}`}
                >
                  <Globe size={14} />
                  {l === 'ko' ? '국문 50개' : '영문 50개'}
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
              <p>간격: 약 {bulkLang === 'ko' ? '10일' : '10일'} (국문·영문 날짜 겹침 없음)</p>
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
            {schedule?.enabled && <span className="px-2 py-0.5 bg-[#000000] text-white text-xs rounded-full">ON</span>}
          </span>
          {scheduleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {scheduleOpen && (
          <div className="px-6 pb-6 border-t border-[#d0d7de] dark:border-[#30363d] pt-5">
            {scheduleLoading || !schedule ? (
              <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-[#57606a]" /></div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3]">자동 발행 활성화</p>
                    <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">매일 자정(UTC)에 실행 — 설정한 주기 도달 시 발행</p>
                  </div>
                  <button onClick={() => setSchedule({ ...schedule, enabled: !schedule.enabled })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${schedule.enabled ? 'bg-[#000000]' : 'bg-[#d0d7de] dark:bg-[#30363d]'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${schedule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">발행 주기</label>
                    <select value={schedule.intervalHours} onChange={(e) => setSchedule({ ...schedule, intervalHours: Number(e.target.value) })} className={inputCls}>
                      {INTERVAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">발행 언어</label>
                    <select value={schedule.lang} onChange={(e) => setSchedule({ ...schedule, lang: e.target.value as Lang })} className={inputCls}>
                      <option value="ko">국문 (KO)</option>
                      <option value="en">영문 (EN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">대상 독자</label>
                    <input type="text" value={schedule.targetAudience} onChange={(e) => setSchedule({ ...schedule, targetAudience: e.target.value })} placeholder="마케터, 사업주" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">톤앤매너</label>
                    <input type="text" value={schedule.tone} onChange={(e) => setSchedule({ ...schedule, tone: e.target.value })} placeholder="전문적이고 실용적인" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">키워드 목록 (한 줄에 하나)</label>
                  <textarea value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} rows={6}
                    placeholder={'AI 마케팅 전략\nSEO 최적화 방법\nGEO 최적화란'}
                    className={`${inputCls} resize-none font-mono`} />
                  <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1">{keywordsText.split('\n').filter((k) => k.trim()).length}개 키워드 등록</p>
                </div>
                {schedule.lastRunAt && (
                  <div className="text-xs text-[#57606a] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] rounded-md p-3 space-y-1">
                    <p>마지막 발행: {new Date(schedule.lastRunAt).toLocaleString('ko-KR')}</p>
                    {schedule.nextRunAt && <p>다음 발행 예정: {new Date(schedule.nextRunAt).toLocaleString('ko-KR')}</p>}
                    <p>다음 키워드: {schedule.keywords[schedule.currentKeywordIndex % Math.max(schedule.keywords.length, 1)] || '—'}</p>
                  </div>
                )}
                <button onClick={handleScheduleSave} disabled={savingSchedule}
                  className="flex items-center gap-2 px-4 py-2 bg-[#000000] hover:bg-[#333333] disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
                >
                  {savingSchedule ? <Loader2 size={14} className="animate-spin" /> : null}
                  설정 저장
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post list */}
      <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden bg-white dark:bg-[#161b22]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d]">
          <span className="text-sm font-medium text-[#24292f] dark:text-[#e6edf3]">
            {lang === 'ko' ? `국문 포스트 (${posts.length})` : `English Posts (${posts.length})`}
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
                    <div className="flex items-center gap-1">
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
    </div>
  );
}
