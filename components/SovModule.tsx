'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Loader2, Plus, X, CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock, Lightbulb, BarChart2 } from 'lucide-react';
import { saveSovRecord, getSovHistory, SovRecord } from '@/lib/storage';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

const PROMPT_TEMPLATES = [
  { id: 'rec', label: '솔루션 추천', text: '[업종] 분야에서 추천할 만한 도구나 서비스가 있나요?' },
  { id: 'cmp', label: '도구 비교', text: '[업종] 관련 서비스들을 비교해서 알려주세요.' },
  { id: 'mkt', label: '시장 조사', text: '[업종] 분야에서 주목받는 회사나 솔루션은 무엇인가요?' },
  { id: 'buy', label: '구매 상담', text: '가성비 좋은 [업종] 도구나 서비스를 추천해주세요.' },
  { id: 'top', label: 'TOP 리스트', text: '[업종] 분야 TOP 5 솔루션을 알려주세요.' },
  { id: 'brand', label: '브랜드 인지', text: '[회사명]이 어떤 서비스인지 알고 있나요? 설명해주세요.' },
];

interface PromptResult {
  prompt: string;
  mentioned: boolean;
  context: string;
  aiResponse: string;
  competitorMentions: { name: string; mentioned: boolean; context: string }[];
}

interface SovResult {
  company: string;
  industry: string;
  mentionRate: number;
  mentionCount: number;
  totalPrompts: number;
  results: PromptResult[];
  competitorSummary: { name: string; mentionCount: number; mentionRate: number }[];
  insights: string;
}

type Language = 'ko' | 'en' | 'ja';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
];

function MentionGauge({ rate, company }: { rate: number; company: string }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (rate / 100) * circ;
  const color = rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444';
  const label = rate >= 70 ? '높음' : rate >= 40 ? '보통' : '낮음';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="148" height="148" viewBox="0 0 148 148">
        <circle cx="74" cy="74" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        <circle
          cx="74" cy="74" r={radius} fill="none"
          stroke={color} strokeWidth="14"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 74 74)"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
        <text x="74" y="68" textAnchor="middle" fontSize="30" fontWeight="800" fill="#0f172a">{rate}%</text>
        <text x="74" y="86" textAnchor="middle" fontSize="11" fill="#94a3b8">AI 언급율</text>
      </svg>
      <div className="text-center">
        <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: color + '20', color }}>
          {label}
        </span>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">{company}</p>
      </div>
    </div>
  );
}

function PromptRow({ r, index }: { r: PromptResult; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span className="flex-1 text-sm text-slate-700 font-medium line-clamp-1">{r.prompt}</span>
        {r.mentioned
          ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          : <XCircle size={18} className="text-rose-400 shrink-0" />}
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {r.mentioned && r.context && (
            <div>
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1">언급 문맥</div>
              <p className="text-xs text-slate-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3 leading-relaxed">
                {r.context}
              </p>
            </div>
          )}
          {!r.mentioned && (
            <p className="text-xs text-slate-400 italic">이 응답에서 회사가 언급되지 않았습니다.</p>
          )}
          {r.aiResponse && (
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">AI 응답 (일부)</div>
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 leading-relaxed">{r.aiResponse}</p>
            </div>
          )}
          {r.competitorMentions.filter(c => c.mentioned).length > 0 && (
            <div>
              <div className="text-[10px] font-black text-amber-600 uppercase tracking-wide mb-1">경쟁사 언급</div>
              <div className="space-y-1">
                {r.competitorMentions.filter(c => c.mentioned).map(c => (
                  <div key={c.name} className="text-xs text-slate-600 bg-amber-50 border border-amber-100 rounded-lg p-2">
                    <span className="font-bold text-amber-700">{c.name}</span> — {c.context}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SovModule({ onToast }: { onToast: (msg: string) => void }) {
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set(PROMPT_TEMPLATES.map(t => t.id)));
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [newCustom, setNewCustom] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SovResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<SovRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [language, setLanguage] = useState<Language>('ko');

  useEffect(() => {
    setHistory(getSovHistory());
  }, []);

  function fillTemplate(text: string) {
    return text.replace('[회사명]', company || '[회사명]').replace('[업종]', industry || '[업종]');
  }

  function addCompetitor() {
    const v = newCompetitor.trim();
    if (v && !competitors.includes(v)) setCompetitors(c => [...c, v]);
    setNewCompetitor('');
  }

  function addCustomPrompt() {
    const v = newCustom.trim();
    if (v && !customPrompts.includes(v)) setCustomPrompts(p => [...p, v]);
    setNewCustom('');
  }

  function toggleTemplate(id: string) {
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const activePrompts = [
    ...PROMPT_TEMPLATES.filter(t => selectedTemplates.has(t.id)).map(t => fillTemplate(t.text)),
    ...customPrompts,
  ].slice(0, 6);

  async function run() {
    if (!company.trim() || !industry.trim()) {
      setError('회사명과 업종을 입력해주세요.');
      return;
    }
    if (activePrompts.length === 0) {
      setError('최소 1개의 프롬프트를 선택하세요.');
      return;
    }
    setIsRunning(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/sov', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, industry, competitors, prompts: activePrompts, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '분석 실패');
      setResult(data);

      const record: SovRecord = {
        company: data.company,
        industry: data.industry,
        mentionRate: data.mentionRate,
        mentionCount: data.mentionCount,
        totalPrompts: data.totalPrompts,
        timestamp: Date.now(),
      };
      saveSovRecord(record);
      setHistory(getSovHistory());
      onToast('AI Share of Voice 측정 완료!');
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setIsRunning(false);
    }
  }

  const allBrands = result
    ? [{ name: result.company, mentionRate: result.mentionRate, mentionCount: result.mentionCount }, ...result.competitorSummary]
    : [];
  const maxRate = allBrands.length ? Math.max(...allBrands.map(b => b.mentionRate), 1) : 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 입력 카드 */}
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-200">
            <Megaphone size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">AI Share of Voice</h3>
            <p className="text-sm text-slate-500">AI가 특정 질문에 답할 때 우리 브랜드를 얼마나 언급하는지 측정합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">회사명 *</label>
            <input
              type="text"
              placeholder="예: MarketerOps"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm transition-all"
              value={company}
              onChange={e => setCompany(e.target.value)}
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">업종 / 카테고리 *</label>
            <input
              type="text"
              placeholder="예: AI 마케팅 SaaS, SEO 도구"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm transition-all"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">응답 언어</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm transition-all"
              value={language}
              onChange={e => setLanguage(e.target.value as Language)}
              disabled={isRunning}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 경쟁사 */}
        <div className="mb-5">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">경쟁사 (선택)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="경쟁사명 입력 후 Enter"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm"
              value={newCompetitor}
              onChange={e => setNewCompetitor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
              disabled={isRunning}
            />
            <button
              onClick={addCompetitor}
              disabled={!newCompetitor.trim() || isRunning}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 disabled:bg-slate-200 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          {competitors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {competitors.map(c => (
                <span key={c} className="flex items-center gap-1 px-3 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs font-bold">
                  {c}
                  <button onClick={() => setCompetitors(prev => prev.filter(x => x !== c))} className="text-violet-400 hover:text-violet-700">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 프롬프트 선택 */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
              측정 프롬프트 <span className="text-violet-600">({activePrompts.length}/6 선택)</span>
            </label>
            <button
              onClick={() => setSelectedTemplates(selectedTemplates.size === PROMPT_TEMPLATES.length ? new Set() : new Set(PROMPT_TEMPLATES.map(t => t.id)))}
              className="text-[10px] font-bold text-violet-600 hover:underline"
            >
              {selectedTemplates.size === PROMPT_TEMPLATES.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {PROMPT_TEMPLATES.map(t => {
              const active = selectedTemplates.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTemplate(t.id)}
                  disabled={isRunning}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    active ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    active ? 'border-violet-600 bg-violet-600' : 'border-slate-300'
                  }`}>
                    {active && <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-violet-600 uppercase tracking-wide mb-0.5">{t.label}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{fillTemplate(t.text)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 커스텀 프롬프트 */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="커스텀 프롬프트 추가 (Enter)"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm"
              value={newCustom}
              onChange={e => setNewCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomPrompt())}
              disabled={isRunning || activePrompts.length >= 6}
            />
            <button
              onClick={addCustomPrompt}
              disabled={!newCustom.trim() || isRunning || activePrompts.length >= 6}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 disabled:bg-slate-200 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          {customPrompts.map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl mb-1">
              <span className="flex-1 text-xs text-indigo-700">{p}</span>
              <button onClick={() => setCustomPrompts(prev => prev.filter((_, j) => j !== i))} className="text-indigo-300 hover:text-indigo-600">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>
        )}

        <button
          onClick={run}
          disabled={isRunning || !company.trim() || !industry.trim() || activePrompts.length === 0}
          className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-violet-100"
        >
          {isRunning ? (
            <><Loader2 size={18} className="animate-spin" /> {activePrompts.length}개 프롬프트 분석 중…</>
          ) : (
            <><Megaphone size={18} /> AI Share of Voice 측정 시작</>
          )}
        </button>
        {isRunning && (
          <p className="text-center text-xs text-slate-400 mt-2">Gemini에 프롬프트를 병렬로 전송 중입니다. 약 10~20초 소요됩니다.</p>
        )}
      </Card>

      {/* 결과 */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 게이지 + 통계 */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <MentionGauge rate={result.mentionRate} company={result.company} />
              <div className="flex-1 w-full">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart2 size={18} className="text-violet-600" />
                  브랜드별 AI 언급율 비교
                </h4>
                <div className="space-y-3">
                  {allBrands.map((b, i) => (
                    <div key={b.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          {i === 0 && <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />}
                          {i > 0 && <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />}
                          {b.name}
                        </span>
                        <span className={`text-sm font-black ${i === 0 ? 'text-violet-600' : 'text-slate-500'}`}>
                          {b.mentionRate}% ({b.mentionCount}/{result.totalPrompts})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-1000 ${i === 0 ? 'bg-violet-500' : 'bg-slate-300'}`}
                          style={{ width: (b.mentionRate / maxRate * 100) + '%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="text-xl font-black text-slate-800">{result.mentionCount}<span className="text-sm text-slate-400">/{result.totalPrompts}</span></div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">언급 횟수</div>
                  </div>
                  <div className="text-center p-3 bg-violet-50 rounded-xl">
                    <div className="text-xl font-black text-violet-700">{result.mentionRate}%</div>
                    <div className="text-[10px] text-violet-400 font-medium mt-0.5">AI 언급율</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="text-xl font-black text-slate-800">{result.competitorSummary.length}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">비교 경쟁사</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 프롬프트별 결과 */}
          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4">프롬프트별 언급 결과</h4>
            <div className="space-y-2">
              {result.results.map((r, i) => (
                <PromptRow key={i} r={r} index={i} />
              ))}
            </div>
          </Card>

          {/* AI 인사이트 */}
          {result.insights && (
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-violet-600" />
                AI 가시성 개선 인사이트
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-violet-50 border border-violet-100 rounded-xl p-4">
                {result.insights}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* 측정 이력 */}
      {history.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => setShowHistory(o => !o)}
            className="w-full flex items-center justify-between"
          >
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              측정 이력 ({history.length}건)
            </h4>
            {showHistory ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {showHistory && (
            <div className="mt-4 space-y-2">
              {history.map((h, i) => {
                const color = h.mentionRate >= 70 ? 'text-emerald-600 bg-emerald-50' : h.mentionRate >= 40 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';
                return (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${color}`}>{h.mentionRate}%</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{h.company}</p>
                      <p className="text-[10px] text-slate-400">{h.industry} · {h.mentionCount}/{h.totalPrompts} 언급</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(h.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
