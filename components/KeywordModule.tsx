'use client';

import { useState } from 'react';
import { Search, Loader2, TrendingUp, Target, Lightbulb, FileText, BarChart2, Tag, Layers } from 'lucide-react';
import AdUnit from '@/components/AdUnit';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

interface KeywordResult {
  intent: string;
  intentDesc: string;
  difficulty: 'Low' | 'Medium' | 'High';
  difficultyDesc: string;
  monthlyVolume: string;
  relatedKeywords: string[];
  longTailKeywords: string[];
  contentAngles: { title: string; description: string }[];
  seoTitles: string[];
  metaDescription: string;
}

interface ClusterResult {
  clusters: {
    intent: string;
    pillar: string;
    keywords: string[];
    description: string;
    contentIdea: string;
  }[];
  summary: string;
}

function intentColor(intent: string) {
  if (intent === '거래형') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (intent === '정보형') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (intent === '비교형') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (intent === '탐색형') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (intent === '로컬형') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function intentCardColor(intent: string) {
  if (intent === '거래형') return 'border-l-emerald-500 bg-emerald-50/30';
  if (intent === '정보형') return 'border-l-blue-500 bg-blue-50/30';
  if (intent === '비교형') return 'border-l-purple-500 bg-purple-50/30';
  if (intent === '탐색형') return 'border-l-amber-500 bg-amber-50/30';
  if (intent === '로컬형') return 'border-l-rose-500 bg-rose-50/30';
  return 'border-l-slate-400';
}

function difficultyColor(d: string) {
  if (d === 'Low') return { bar: 'bg-emerald-500', text: 'text-emerald-600', label: '낮음' };
  if (d === 'High') return { bar: 'bg-rose-500', text: 'text-rose-600', label: '높음' };
  return { bar: 'bg-amber-500', text: 'text-amber-600', label: '중간' };
}

// ── 단일 키워드 분석 모드 ──
function SingleMode({ onToast }: { onToast: (msg: string) => void }) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KeywordResult | null>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '분석 실패');
      setResult(data);
      onToast('키워드 분석이 완료되었습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const diff = result ? difficultyColor(result.difficulty) : null;

  return (
    <>
      <Card className="p-6 md:p-8 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="분석할 키워드 입력 (예: AI 마케팅 도구)"
            className="flex-1 pl-5 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm text-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
            disabled={loading}
          />
          <button
            onClick={analyze}
            disabled={loading || !keyword.trim()}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> 분석 중...</> : <><Search size={18} /> 키워드 분석</>}
          </button>
        </div>
        {error && <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>}
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-indigo-600" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-wide">검색 의도</span>
              </div>
              <div className="mb-2">
                <span className={'px-3 py-1 rounded-full text-sm font-black border ' + intentColor(result.intent)}>
                  {result.intent}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-3">{result.intentDesc}</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={18} className="text-indigo-600" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-wide">경쟁도</span>
              </div>
              <div className={'text-2xl font-black mb-2 ' + diff!.text}>{diff!.label}</div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                <div className={'h-2 rounded-full ' + diff!.bar + (result.difficulty === 'Low' ? ' w-1/3' : result.difficulty === 'Medium' ? ' w-2/3' : ' w-full')} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{result.difficultyDesc}</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-indigo-600" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-wide">예상 월 검색량</span>
              </div>
              <div className="text-2xl font-black text-slate-800 mb-2">{result.monthlyVolume}</div>
              <p className="text-xs text-slate-400">AI 추정치 (실제 값과 다를 수 있음)</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Tag size={18} className="text-indigo-600" />
                연관 키워드
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.relatedKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-indigo-100 transition-colors"
                    onClick={() => { setKeyword(kw); onToast(kw + ' 키워드로 변경됐습니다.'); }}>
                    {kw}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Search size={18} className="text-indigo-600" />
                롱테일 키워드
              </h4>
              <div className="space-y-2">
                {result.longTailKeywords.map((kw, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer group"
                    onClick={() => { setKeyword(kw); onToast(kw + ' 키워드로 변경됐습니다.'); }}>
                    <span className="w-5 h-5 bg-slate-200 group-hover:bg-indigo-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:text-indigo-700 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-700 font-medium">{kw}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-indigo-600" />
              콘텐츠 방향 제안
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.contentAngles.map((angle, i) => (
                <div key={i} className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-sm font-black mb-3">{i + 1}</div>
                  <h5 className="font-bold text-slate-800 text-sm mb-2">{angle.title}</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{angle.description}</p>
                </div>
              ))}
            </div>
          </Card>

          <AdUnit slot="0987654321" />

          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              SEO 최적화 제목 & 메타 설명
            </h4>
            <div className="space-y-3 mb-4">
              {result.seoTitles.map((title, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg shrink-0 mt-0.5">T{i + 1}</span>
                  <p className="text-sm font-semibold text-slate-700">{title}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-2">Meta Description</div>
              <p className="text-sm text-slate-700 leading-relaxed">{result.metaDescription}</p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

// ── 키워드 클러스터링 모드 ──
function ClusterMode({ onToast }: { onToast: (msg: string) => void }) {
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClusterResult | null>(null);
  const [error, setError] = useState('');

  const keywords = raw.split('\n').map(k => k.trim()).filter(Boolean);

  const analyze = async () => {
    if (keywords.length < 2) {
      setError('키워드를 2개 이상 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/keyword/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '분석 실패');
      setResult(data);
      onToast('키워드 클러스터링 완료!');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 md:p-8 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <p className="text-xs text-slate-500 mb-3">키워드를 한 줄에 하나씩 입력하세요 (2~30개)</p>
        <textarea
          className="w-full h-44 pl-5 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-sm resize-none mb-3"
          placeholder={'AI 마케팅 도구\nSEO 자동화\nGEO 최적화\n마케팅 AI 솔루션\n콘텐츠 자동 생성'}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{keywords.length}개 키워드 입력됨</span>
          <button
            onClick={analyze}
            disabled={loading || keywords.length < 2}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> 클러스터링 중...</> : <><Layers size={18} /> 의도별 클러스터링</>}
          </button>
        </div>
        {error && <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>}
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 요약 */}
          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-indigo-600" />
              전략 요약
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50 border border-indigo-100 rounded-xl p-4">{result.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.clusters.map(c => (
                <span key={c.intent} className={'text-xs font-black px-3 py-1 rounded-full border ' + intentColor(c.intent)}>
                  {c.intent} {c.keywords.length}개
                </span>
              ))}
            </div>
          </Card>

          {/* 클러스터 카드 */}
          <div className="space-y-4">
            {result.clusters.map((cluster, i) => (
              <div key={i} className={'border-l-4 rounded-2xl border border-slate-200 p-6 ' + intentCardColor(cluster.intent)}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className={'text-xs font-black px-3 py-1 rounded-full border ' + intentColor(cluster.intent)}>
                      {cluster.intent}
                    </span>
                    <h4 className="font-bold text-slate-800 mt-2 text-lg">
                      대표: <span className="text-indigo-700">{cluster.pillar}</span>
                    </h4>
                  </div>
                  <span className="text-2xl font-black text-slate-300">{cluster.keywords.length}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {cluster.keywords.map((kw, j) => (
                    <span key={j} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm">
                      {kw}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/70 rounded-xl p-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">그룹 특징</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{cluster.description}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">추천 콘텐츠</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{cluster.contentIdea}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── 메인 컴포넌트 ──
export default function KeywordModule({ onToast }: { onToast: (msg: string) => void }) {
  const [mode, setMode] = useState<'single' | 'cluster'>('single');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 + 모드 스위처 */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-lg">
            <Search size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">AI 키워드 분석</h3>
            <p className="text-sm text-slate-500">검색 의도, 경쟁도, 클러스터링을 AI가 즉시 분석합니다.</p>
          </div>
        </div>
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1 self-start md:self-auto">
          <button
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'single' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Search size={15} />
            단일 분석
          </button>
          <button
            onClick={() => setMode('cluster')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'cluster' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Layers size={15} />
            클러스터링
          </button>
        </div>
      </div>

      {mode === 'single' ? <SingleMode onToast={onToast} /> : <ClusterMode onToast={onToast} />}
    </div>
  );
}
