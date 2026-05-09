'use client';

import { useState } from 'react';
import { Sparkles, Globe, Zap, Loader2, MessageSquare, Share2, Mail, BarChart3, Copy, ChevronRight } from 'lucide-react';

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

export default function ContentHubModule({ onToast }: { onToast: (msg: string) => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');

  const generateAll = () => {
    if (!content) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      onToast('모든 채널별 소재 생성이 완료되었습니다.');
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Multi-Channel 콘텐츠 허브</h3>
            <p className="text-sm text-slate-500">핵심 소스 하나로 5분 만에 일주일 치 마케팅 소재를 준비하세요.</p>
          </div>
          <Sparkles className="text-indigo-500 animate-pulse" size={28} />
        </div>

        <textarea
          className="w-full h-48 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all mb-4"
          placeholder="블로그 포스팅, 뉴스레터 원고 혹은 핵심 아이디어를 자유롭게 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 justify-end">
          <button className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
            <Globe size={16} /> URL 분석
          </button>
          <button
            onClick={generateAll}
            disabled={isGenerating || !content}
            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 disabled:bg-slate-300 flex items-center gap-2 transition-all"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
            AI 자동 소재 생성
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { icon: <MessageSquare size={18} />, label: 'Blog', color: 'indigo', title: 'SEO 최적화 블로그 본문' },
          { icon: <Share2 size={18} />, label: 'Social', color: 'pink', title: '인스타그램 카드뉴스 기획' },
          { icon: <Mail size={18} />, label: 'Newsletter', color: 'blue', title: '고객 맞춤 이메일 뉴스레터' },
          { icon: <BarChart3 size={18} />, label: 'Ads', color: 'purple', title: '퍼포먼스 광고 카피 (A/B)' },
        ].map((item, i) => (
          <Card key={i} className="group hover:border-indigo-300 transition-all">
            <div className={`h-1.5 w-full bg-${item.color}-500 opacity-20 group-hover:opacity-100 transition-opacity`} />
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Badge variant="primary">{item.label}</Badge>
                <button className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                  <Copy size={18} />
                </button>
              </div>
              <h5 className="font-bold text-slate-800 mb-4">{item.title}</h5>
              <div className="space-y-2">
                <div className={`h-3 rounded w-full ${isGenerating ? 'bg-slate-100 animate-pulse' : 'bg-slate-50'}`} />
                <div className={`h-3 rounded w-5/6 ${isGenerating ? 'bg-slate-100 animate-pulse' : 'bg-slate-50'}`} />
                <div className={`h-3 rounded w-4/6 ${isGenerating ? 'bg-slate-100 animate-pulse' : 'bg-slate-50'}`} />
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium tracking-tight">Last Updated: Just now</span>
                <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                  상세 편집 <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
