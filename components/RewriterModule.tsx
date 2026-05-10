'use client';

import { useState } from 'react';
import { PenLine, Loader2, Copy, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

interface RewriteResult {
  rewritten: string;
  keyChanges: string[];
  seoScore: string;
  readabilityNote: string;
}

const GOALS = [
  { key: 'seo', label: 'SEO 최적화', desc: '검색 노출을 높이는 키워드 구조 개선', color: 'indigo' },
  { key: 'geo', label: 'GEO 최적화', desc: 'AI 언어모델 인용 학습에 최적화', color: 'purple' },
  { key: 'readability', label: '가독성 개선', desc: '문장을 짧고 명확하게 재구성', color: 'emerald' },
  { key: 'concise', label: '간결하게', desc: '핵심만 남기고 분량 30~50% 절감', color: 'amber' },
] as const;

type Goal = typeof GOALS[number]['key'];

const GOAL_COLORS: Record<string, string> = {
  indigo: 'border-indigo-500 bg-indigo-600 text-white',
  purple: 'border-purple-500 bg-purple-600 text-white',
  emerald: 'border-emerald-500 bg-emerald-600 text-white',
  amber: 'border-amber-500 bg-amber-600 text-white',
};

const GOAL_OUTLINE: Record<string, string> = {
  indigo: 'border-indigo-200 hover:border-indigo-400',
  purple: 'border-purple-200 hover:border-purple-400',
  emerald: 'border-emerald-200 hover:border-emerald-400',
  amber: 'border-amber-200 hover:border-amber-400',
};

export default function RewriterModule({ onToast }: { onToast: (msg: string) => void }) {
  const [original, setOriginal] = useState('');
  const [goal, setGoal] = useState<Goal>('seo');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState('');
  const [view, setView] = useState<'split' | 'rewritten'>('split');

  const rewrite = async () => {
    if (!original.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: original, goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '리라이팅 실패');
      setResult(data);
      setView('split');
      onToast('콘텐츠 리라이팅이 완료되었습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectedGoal = GOALS.find((g) => g.key === goal)!;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="p-6 md:p-8 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-lg">
            <PenLine size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">AI 콘텐츠 리라이터</h3>
            <p className="text-sm text-slate-500">기존 콘텐츠를 목표에 맞게 AI가 즉시 리라이팅합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {GOALS.map((g) => (
            <button
              key={g.key}
              onClick={() => setGoal(g.key)}
              className={'p-3 rounded-2xl border-2 text-left transition-all ' + (goal === g.key ? GOAL_COLORS[g.color] : 'bg-white text-slate-700 ' + GOAL_OUTLINE[g.color])}
            >
              <div className={'text-xs font-black mb-1 ' + (goal === g.key ? 'text-white' : 'text-slate-800')}>{g.label}</div>
              <div className={'text-[10px] leading-relaxed ' + (goal === g.key ? 'text-white/80' : 'text-slate-400')}>{g.desc}</div>
            </button>
          ))}
        </div>

        <textarea
          className="w-full h-40 p-5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-sm resize-none mb-4"
          placeholder="리라이팅할 원본 텍스트를 붙여넣으세요 (블로그 본문, 제품 설명, 광고 카피 등)..."
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
          disabled={loading}
        />

        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>
        )}

        <button
          onClick={rewrite}
          disabled={loading || !original.trim()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> AI 리라이팅 중...</>
            : <><Sparkles size={18} /> {selectedGoal.label}로 리라이팅</>}
        </button>
      </Card>

      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 p-5 bg-indigo-950 text-white rounded-2xl">
              <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3">주요 변경 사항</div>
              <ul className="space-y-1.5">
                {result.keyChanges.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <ArrowRight size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex-1 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1">SEO 효과</div>
                <p className="text-xs text-emerald-800 leading-relaxed">{result.seoScore}</p>
              </div>
              <div className="flex-1 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-wide mb-1">가독성</div>
                <p className="text-xs text-blue-800 leading-relaxed">{result.readabilityNote}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {(['split', 'rewritten'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={'px-4 py-2 text-xs font-bold rounded-xl transition-all ' + (view === v ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500')}
              >
                {v === 'split' ? '원본 결과 비교' : '결과만 보기'}
              </button>
            ))}
          </div>

          {view === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wide">원본</span>
                  <span className="text-[10px] text-slate-300">{original.length}자</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{original}</p>
              </Card>
              <Card className="p-5 border-indigo-200 bg-indigo-50/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wide">리라이팅 결과</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">{result.rewritten.length}자</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(result.rewritten); onToast('클립보드에 복사되었습니다.'); }}
                      className="text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{result.rewritten}</p>
              </Card>
            </div>
          ) : (
            <Card className="p-6 border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-indigo-600" />
                  <span className="text-sm font-bold text-slate-800">리라이팅 완료</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(result.rewritten); onToast('클립보드에 복사되었습니다.'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <Copy size={12} /> 전체 복사
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.rewritten}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
