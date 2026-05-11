'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, Loader2, MessageSquare, Share2, Mail, BarChart3, Copy, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import AdUnit from '@/components/AdUnit';
import { incrementContentCount, saveContentRecord, getContentHistory, ContentRecord } from '@/lib/storage';

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) => {
  const styles: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600',
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

interface ContentResult {
  blog: string;
  social: string;
  newsletter: string;
  ads: string;
}

const CHANNELS = [
  { key: 'blog' as const, icon: <MessageSquare size={18} />, label: 'Blog', color: 'indigo', title: 'SEO 최적화 블로그 본문' },
  { key: 'social' as const, icon: <Share2 size={18} />, label: 'Social', color: 'pink', title: '인스타그램 카드뉴스 기획' },
  { key: 'newsletter' as const, icon: <Mail size={18} />, label: 'Newsletter', color: 'blue', title: '고객 맞춤 이메일 뉴스레터' },
  { key: 'ads' as const, icon: <BarChart3 size={18} />, label: 'Ads', color: 'purple', title: '퍼포먼스 광고 카피 (A/B)' },
];

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
      <div className={`h-1.5 w-full bg-${channel.color}-500 opacity-30 group-hover:opacity-100 transition-opacity`} />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <Badge variant="primary">{channel.label}</Badge>
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

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-medium tracking-tight">
            {content ? 'AI 생성 완료' : 'AI 대기 중'}
          </span>
        </div>
      </div>
    </Card>
  );
}

function HistoryItem({ record, onLoad, onCopy }: { record: ContentRecord; onLoad: (r: ContentRecord) => void; onCopy: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">{record.sourcePreview}</p>
          <p className="text-[10px] text-slate-400">{new Date(record.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {CHANNELS.map(ch => (
            <div key={ch.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{ch.label}</span>
                <button onClick={() => onCopy(record[ch.key])} className="text-slate-300 hover:text-indigo-600">
                  <Copy size={12} />
                </button>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 leading-relaxed line-clamp-3">{record[ch.key]}</p>
            </div>
          ))}
          <button
            onClick={() => onLoad(record)}
            className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors"
          >
            이 결과 불러오기
          </button>
        </div>
      )}
    </div>
  );
}

export default function ContentHubModule({ onToast }: { onToast: (msg: string) => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ContentResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ContentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistory(getContentHistory());
  }, []);

  const generateAll = async () => {
    if (!content.trim()) return;
    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '생성 실패');
      setResult(data);
      incrementContentCount();

      const record: ContentRecord = {
        id: Date.now().toString(),
        sourcePreview: content.trim().slice(0, 80),
        blog: data.blog,
        social: data.social,
        newsletter: data.newsletter,
        ads: data.ads,
        timestamp: Date.now(),
      };
      saveContentRecord(record);
      setHistory(getContentHistory());

      onToast('모든 채널별 소재 생성이 완료되었습니다.');
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

  const handleLoad = (record: ContentRecord) => {
    setResult({ blog: record.blog, social: record.social, newsletter: record.newsletter, ads: record.ads });
    setContent(record.sourcePreview);
    setShowHistory(false);
    onToast('이전 결과를 불러왔습니다.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Multi-Channel 콘텐츠 허브</h3>
            <p className="text-sm text-slate-500">핵심 소스 하나로 4개 채널 마케팅 소재를 AI가 자동 생성합니다.</p>
          </div>
          <Sparkles className="text-indigo-500 animate-pulse" size={28} />
        </div>

        <textarea
          className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all mb-4 resize-none"
          placeholder="블로그 포스팅, 뉴스레터 원고 혹은 핵심 아이디어를 자유롭게 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isGenerating}
        />

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-between items-center">
          <button
            onClick={() => setShowHistory(o => !o)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-bold transition-colors"
          >
            <Clock size={16} />
            생성 이력 {history.length > 0 && <span className="px-1.5 py-0.5 bg-slate-100 rounded-full text-[10px]">{history.length}</span>}
          </button>
          <button
            onClick={generateAll}
            disabled={isGenerating || !content.trim()}
            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 disabled:bg-slate-300 flex items-center gap-2 transition-all"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
            {isGenerating ? 'AI 생성 중...' : 'AI 자동 소재 생성'}
          </button>
        </div>
      </Card>

      {showHistory && history.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              콘텐츠 생성 이력
            </h4>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map(r => (
              <HistoryItem key={r.id} record={r} onLoad={handleLoad} onCopy={handleCopy} />
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CHANNELS.map((channel) => (
          <ContentCard
            key={channel.key}
            channel={channel}
            content={result?.[channel.key]}
            isGenerating={isGenerating}
            onCopy={handleCopy}
          />
        ))}
      </div>

      {result && <AdUnit slot="1122334455" />}
    </div>
  );
}
