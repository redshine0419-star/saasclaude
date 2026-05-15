'use client';

import { useState } from 'react';
import { Sparkles, Zap, Loader2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import RewriterModule from '@/components/RewriterModule';

type Tab = 'generate' | 'rewriter';

type ChannelKey = 'blog' | 'social' | 'newsletter' | 'ads';

const CHANNELS: { key: ChannelKey; label: string; icon: string; color: string; title: string }[] = [
  { key: 'blog', label: '블로그', icon: '📝', color: 'indigo', title: 'SEO 최적화 블로그 본문' },
  { key: 'social', label: '인스타그램', icon: '📸', color: 'pink', title: '인스타그램 카드뉴스 기획' },
  { key: 'newsletter', label: '뉴스레터', icon: '✉️', color: 'blue', title: '고객 맞춤 이메일 뉴스레터' },
  { key: 'ads', label: '광고카피', icon: '📣', color: 'purple', title: '퍼포먼스 광고 카피 (A/B)' },
];

const TONES = [
  { key: '친근한', label: '친근한' },
  { key: '전문적', label: '전문적' },
  { key: '유머러스', label: '유머러스' },
  { key: '감성적', label: '감성적' },
] as const;

type Tone = typeof TONES[number]['key'];

interface ContentResult {
  blog: string;
  social: string;
  newsletter: string;
  ads: string;
}

const CHANNEL_COLOR_ACTIVE: Record<string, string> = {
  indigo: 'bg-indigo-600 border-indigo-600 text-white',
  pink: 'bg-pink-500 border-pink-500 text-white',
  blue: 'bg-blue-600 border-blue-600 text-white',
  purple: 'bg-purple-600 border-purple-600 text-white',
};

const CHANNEL_COLOR_INACTIVE: Record<string, string> = {
  indigo: 'border-indigo-200 text-indigo-700 hover:border-indigo-400 bg-white',
  pink: 'border-pink-200 text-pink-700 hover:border-pink-400 bg-white',
  blue: 'border-blue-200 text-blue-700 hover:border-blue-400 bg-white',
  purple: 'border-purple-200 text-purple-700 hover:border-purple-400 bg-white',
};

const CHANNEL_ACCENT: Record<string, string> = {
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

function ContentCard({
  channel,
  content,
  isGenerating,
  onCopy,
}: {
  channel: typeof CHANNELS[0];
  content: string | undefined;
  isGenerating: boolean;
  onCopy: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="group hover:border-indigo-300 transition-all">
      <div className={`h-1.5 w-full ${CHANNEL_ACCENT[channel.color]} opacity-30 group-hover:opacity-100 transition-opacity`} />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span>{channel.icon}</span>
            {channel.label}
          </span>
          {content && (
            <button onClick={() => onCopy(content)} className="text-slate-300 hover:text-indigo-600 transition-colors">
              <Copy size={18} />
            </button>
          )}
        </div>
        <h5 className="font-bold text-slate-800 mb-4">{channel.title}</h5>

        {isGenerating && !content ? (
          <div className="space-y-2">
            <div className="h-3 rounded w-full bg-slate-100 animate-pulse" />
            <div className="h-3 rounded w-5/6 bg-slate-100 animate-pulse" />
            <div className="h-3 rounded w-4/6 bg-slate-100 animate-pulse" />
          </div>
        ) : content ? (
          <div>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {expanded ? content : content.slice(0, 200) + (content.length > 200 ? '...' : '')}
            </p>
            {content.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
              >
                {expanded ? <><ChevronUp size={12} /> 접기</> : <><ChevronDown size={12} /> 전체 보기</>}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-3 rounded w-full bg-slate-50" />
            <div className="h-3 rounded w-5/6 bg-slate-50" />
            <div className="h-3 rounded w-4/6 bg-slate-50" />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-medium tracking-tight">
            {content ? 'AI 생성 완료' : 'AI 대기 중'}
          </span>
        </div>
      </div>
    </Card>
  );
}

function ContentGenerateTab({ onToast }: { onToast: (msg: string) => void }) {
  const [selectedChannels, setSelectedChannels] = useState<Set<ChannelKey>>(
    new Set(['blog', 'social', 'newsletter', 'ads'])
  );
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('친근한');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ContentResult | null>(null);
  const [error, setError] = useState('');

  const toggleChannel = (key: ChannelKey) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const generate = async () => {
    if (!topic.trim() || selectedChannels.size === 0) return;
    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/content-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), tone, channels: Array.from(selectedChannels) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '생성 실패');
      setResult(data);
      onToast('선택한 채널별 콘텐츠 생성이 완료되었습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onToast('클립보드에 복사되었습니다.');
  };

  const visibleChannels = CHANNELS.filter((ch) => selectedChannels.has(ch.key));

  return (
    <div className="space-y-6">
      {/* Input card */}
      <Card className="p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Multi-Channel 콘텐츠 생성</h3>
            <p className="text-sm text-slate-500">주제와 채널을 선택하면 AI가 각 채널에 맞는 콘텐츠를 자동 생성합니다.</p>
          </div>
          <Sparkles className="text-indigo-500 animate-pulse" size={28} />
        </div>

        {/* Channel checkboxes */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">생성할 채널 선택</p>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => {
              const active = selectedChannels.has(ch.key);
              return (
                <button
                  key={ch.key}
                  onClick={() => toggleChannel(ch.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    active ? CHANNEL_COLOR_ACTIVE[ch.color] : CHANNEL_COLOR_INACTIVE[ch.color]
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] shrink-0 ${
                      active ? 'border-white bg-white/20' : 'border-current'
                    }`}
                  >
                    {active && '✓'}
                  </span>
                  <span>{ch.icon}</span>
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic input */}
        <input
          type="text"
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all mb-4"
          placeholder="주제나 키워드를 입력하세요 (예: 봄 신제품 출시, 건강한 아침 루틴)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isGenerating}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
        />

        {/* Tone selector */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">톤 선택</p>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTone(t.key)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                  tone === t.key
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={isGenerating || !topic.trim() || selectedChannels.size === 0}
          className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 disabled:bg-slate-300 flex items-center justify-center gap-2 transition-all"
        >
          {isGenerating ? (
            <><Loader2 size={16} className="animate-spin" /> AI 생성 중...</>
          ) : (
            <><Zap size={16} fill="currentColor" /> AI 콘텐츠 생성</>
          )}
        </button>
      </Card>

      {/* Result cards */}
      {(isGenerating || result) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleChannels.map((channel) => (
            <ContentCard
              key={channel.key}
              channel={channel}
              content={result?.[channel.key]}
              isGenerating={isGenerating}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UnifiedContentModule({ onToast }: { onToast: (msg: string) => void }) {
  const [tab, setTab] = useState<Tab>('generate');

  return (
    <div>
      {/* Tab bar — same style as WebModule */}
      <div className="flex gap-1 mb-6 border-b border-[#d0d7de] dark:border-[#30363d]">
        <button
          onClick={() => setTab('generate')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'generate'
              ? 'border-[#0969da] text-[#0969da] dark:border-[#388bfd] dark:text-[#388bfd]'
              : 'border-transparent text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
          }`}
        >
          ✨ 콘텐츠 생성
        </button>
        <button
          onClick={() => setTab('rewriter')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'rewriter'
              ? 'border-[#0969da] text-[#0969da] dark:border-[#388bfd] dark:text-[#388bfd]'
              : 'border-transparent text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
          }`}
        >
          ✏️ 콘텐츠 리라이터
        </button>
      </div>

      {/* Tab content */}
      {tab === 'generate' && <ContentGenerateTab onToast={onToast} />}
      {tab === 'rewriter' && <RewriterModule onToast={onToast} />}
    </div>
  );
}
