'use client';

import { useState } from 'react';
import { Sparkles, Zap, Loader2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import RewriterModule from '@/components/RewriterModule';
import { useAppLang } from '@/components/AppLangContext';
import { t } from '@/lib/app-i18n';

type Tab = 'generate' | 'rewriter';

type ChannelKey = 'blog' | 'social' | 'newsletter' | 'ads';

const CHANNELS: { key: ChannelKey; labelKey: string; icon: string; color: string; titleKey: string }[] = [
  { key: 'blog', labelKey: 'blog', icon: '📝', color: 'indigo', titleKey: 'blogTitle' },
  { key: 'social', labelKey: 'instagram', icon: '📸', color: 'pink', titleKey: 'igTitle' },
  { key: 'newsletter', labelKey: 'newsletter', icon: '✉️', color: 'blue', titleKey: 'nlTitle' },
  { key: 'ads', labelKey: 'adCopy', icon: '📣', color: 'purple', titleKey: 'adTitle' },
];

const TONE_KEYS = ['friendly', 'professional', 'humorous', 'emotional'] as const;
type Tone = typeof TONE_KEYS[number];

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
  lang,
}: {
  channel: typeof CHANNELS[0];
  content: string | undefined;
  isGenerating: boolean;
  onCopy: (text: string) => void;
  lang: import('@/lib/app-i18n').AppLang;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="group hover:border-indigo-300 transition-all">
      <div className={`h-1.5 w-full ${CHANNEL_ACCENT[channel.color]} opacity-30 group-hover:opacity-100 transition-opacity`} />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span>{channel.icon}</span>
            {t('content', channel.labelKey, lang)}
          </span>
          {content && (
            <button onClick={() => onCopy(content)} className="text-slate-300 hover:text-indigo-600 transition-colors">
              <Copy size={18} />
            </button>
          )}
        </div>
        <h5 className="font-bold text-slate-800 mb-4">{t('content', channel.titleKey, lang)}</h5>

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
                {expanded ? <><ChevronUp size={12} /> {t('common', 'collapse', lang)}</> : <><ChevronDown size={12} /> {t('common', 'viewAll', lang)}</>}
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
            {content ? t('content', 'generated', lang) : t('content', 'waiting', lang)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function ContentGenerateTab({ onToast }: { onToast: (msg: string) => void }) {
  const { lang } = useAppLang();
  const [selectedChannels, setSelectedChannels] = useState<Set<ChannelKey>>(
    new Set(['blog', 'social', 'newsletter', 'ads'])
  );
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('friendly');
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
      onToast(t('content', 'complete', lang));
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onToast(t('common', 'copiedToClipboard', lang));
  };

  const visibleChannels = CHANNELS.filter((ch) => selectedChannels.has(ch.key));

  return (
    <div className="space-y-6">
      {/* Input card */}
      <Card className="p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{t('content', 'title', lang)}</h3>
            <p className="text-sm text-slate-500">{t('content', 'subtitle', lang)}</p>
          </div>
          <Sparkles className="text-indigo-500 animate-pulse" size={28} />
        </div>

        {/* Channel checkboxes */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('content', 'channelLabel', lang)}</p>
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
                  {t('content', ch.labelKey, lang)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic input */}
        <input
          type="text"
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all mb-4"
          placeholder={t('content', 'topicPlaceholder', lang)}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isGenerating}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
        />

        {/* Tone selector */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('content', 'toneLabel', lang)}</p>
          <div className="flex flex-wrap gap-2">
            {TONE_KEYS.map((tk) => (
              <button
                key={tk}
                onClick={() => setTone(tk)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                  tone === tk
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white'
                }`}
              >
                {t('content', tk, lang)}
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
            <><Loader2 size={16} className="animate-spin" /> {t('common', 'generating', lang)}</>
          ) : (
            <><Zap size={16} fill="currentColor" /> {t('content', 'generateBtn', lang)}</>
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
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UnifiedContentModule({ onToast }: { onToast: (msg: string) => void }) {
  const { lang } = useAppLang();
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
          {t('content', 'generateTab', lang)}
        </button>
        <button
          onClick={() => setTab('rewriter')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'rewriter'
              ? 'border-[#0969da] text-[#0969da] dark:border-[#388bfd] dark:text-[#388bfd]'
              : 'border-transparent text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'
          }`}
        >
          {t('content', 'rewriteTab', lang)}
        </button>
      </div>

      {/* Tab content */}
      {tab === 'generate' && <ContentGenerateTab onToast={onToast} />}
      {tab === 'rewriter' && <RewriterModule onToast={onToast} />}
    </div>
  );
}
