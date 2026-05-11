'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Loader2, Plus, X, CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock, Lightbulb, BarChart2, Sparkles, RefreshCw, Edit2, Check } from 'lucide-react';
import { saveSovRecord, getSovHistory, SovRecord } from '@/lib/storage';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ' + className}>
    {children}
  </div>
);

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
        <circle cx="74" cy="74" r={radius} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 74 74)" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
        <text x="74" y="68" textAnchor="middle" fontSize="30" fontWeight="800" fill="#0f172a">{rate}%</text>
        <text x="74" y="86" textAnchor="middle" fontSize="11" fill="#94a3b8">AI 언급율</text>
      </svg>
      <div className="text-center">
        <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: color + '20', color }}>{label}</span>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">{company}</p>
      </div>
    </div>
  );
}

function PromptRow({ r, index }: { r: PromptResult; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
        <span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0">{index + 1}</span>
        <span className="flex-1 text-sm text-slate-700 font-medium line-clamp-1">{r.prompt}</span>
        {r.mentioned ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> : <XCircle size={18} className="text-rose-400 shrink-0" />}
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {r.mentioned && r.context && (
            <div>
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1">언급 문맥</div>
              <p className="text-xs text-slate-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3 leading-relaxed">{r.context}</p>
            </div>
          )}
          {!r.mentioned && <p className="text-xs text-slate-400 italic">이 응답에서 회사가 언급되지 않았습니다.</p>}
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

function EditablePrompt({ value, onChange, onDelete, index }: { value: string; onChange: (v: string) => void; onDelete: () => void; index: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => { onChange(draft.trim() || value); setEditing(false); };

  return (
    <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl group">
      <span className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
      {editing ? (
        <>
          <input
            autoFocus
            className="flex-1 text-sm bg-white border border-slate-300 rounded-lg px-2 py-1 outline-none focus:border-slate-500"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          />
          <button onClick={save} className="text-slate-500 hover:text-slate-800 shrink-0"><Check size={15} /></button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-slate-700 leading-relaxed">{value}</span>
          <button onClick={() => { setDraft(value); setEditing(true); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 shrink-0 transition-opacity"><Edit2 size={13} /></button>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 shrink-0 transition-opacity"><X size={13} /></button>
        </>
      )}
    </div>
  );
}

export default function SovModule({ onToast }: { onToast: (msg: string) => void }) {
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [promptsGenerated, setPromptsGenerated] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SovResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<SovRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { setHistory(getSovHistory()); }, []);

  // 업종 변경 시 생성된 프롬프트 초기화
  useEffect(() => {
    setPromptsGenerated(false);
    setPrompts([]);
  }, [industry]);

  function addCompetitor() {
    const v = newCompetitor.trim();
    if (v && !competitors.includes(v)) setCompetitors(c => [...c, v]);
    setNewCompetitor('');
  }

  async function generatePrompts() {
    if (!company.trim() || !industry.trim()) {
      setError('회사명과 업종을 먼저 입력해주세요.');
      return;
    }
    setGeneratingPrompts(true);
    setError('');
    try {
      const res = await fetch('/api/sov/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, industry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '생성 실패');
      setPrompts(data.prompts);
      setPromptsGenerated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '프롬프트 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingPrompts(false);
    }
  }

  function addPrompt() {
    const v = newPrompt.trim();
    if (v && prompts.length < 6) { setPrompts(p => [...p, v]); setNewPrompt(''); }
  }

  async function run() {
    if (!company.trim() || !industry.trim()) { setError('회사명과 업종을 입력해주세요.'); return; }
    if (prompts.length === 0) { setError('프롬프트를 먼저 생성해주세요.'); return; }
    setIsRunning(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/sov', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, industry, competitors, prompts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '분석 실패');
      setResult(data);

      saveSovRecord({ company: data.company, industry: data.industry, mentionRate: data.mentionRate, mentionCount: data.mentionCount, totalPrompts: data.totalPrompts, timestamp: Date.now() });
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
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <Megaphone size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">AI Share of Voice</h3>
            <p className="text-sm text-slate-500">AI가 특정 질문에 답할 때 우리 브랜드를 얼마나 언급하는지 측정합니다.</p>
          </div>
        </div>

        {/* Step 1 — 기본 정보 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">1</span>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wide">기본 정보 입력</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">회사명 *</label>
              <input type="text" placeholder="예: MarketerOps"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
                value={company} onChange={e => setCompany(e.target.value)} disabled={isRunning} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">업종 / 카테고리 *</label>
              <input type="text" placeholder="예: AI 마케팅 SaaS, SEO 도구"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm transition-all"
                value={industry} onChange={e => setIndustry(e.target.value)} disabled={isRunning} />
            </div>
          </div>
        </div>

        {/* Step 2 — 경쟁사 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-black flex items-center justify-center">2</span>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wide">경쟁사 (선택)</span>
          </div>
          <div className="flex gap-2 mb-2">
            <input type="text" placeholder="경쟁사명 입력 후 Enter"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
              value={newCompetitor} onChange={e => setNewCompetitor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCompetitor())} disabled={isRunning} />
            <button onClick={addCompetitor} disabled={!newCompetitor.trim() || isRunning}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 disabled:bg-slate-200 transition-all">
              <Plus size={16} />
            </button>
          </div>
          {competitors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {competitors.map(c => (
                <span key={c} className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold">
                  {c}
                  <button onClick={() => setCompetitors(p => p.filter(x => x !== c))} className="text-slate-400 hover:text-slate-700"><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Step 3 — 프롬프트 생성 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${promptsGenerated ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wide">AI 측정 프롬프트 생성</span>
          </div>

          {!promptsGenerated ? (
            <button
              onClick={generatePrompts}
              disabled={!company.trim() || !industry.trim() || generatingPrompts || isRunning}
              className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-slate-900 disabled:border-slate-100 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 disabled:text-slate-300 transition-all group"
            >
              {generatingPrompts ? (
                <><Loader2 size={16} className="animate-spin" /> 업종에 맞는 프롬프트 생성 중…</>
              ) : (
                <><Sparkles size={16} className="group-hover:text-slate-900" /> 업종 기반 측정 프롬프트 6개 자동 생성</>
              )}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">{prompts.length}개 프롬프트 · 클릭해서 편집 가능</span>
                <button onClick={generatePrompts} disabled={generatingPrompts || isRunning}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 font-bold transition-colors disabled:opacity-30">
                  <RefreshCw size={12} className={generatingPrompts ? 'animate-spin' : ''} />
                  재생성
                </button>
              </div>
              {prompts.map((p, i) => (
                <EditablePrompt key={i} index={i} value={p}
                  onChange={v => setPrompts(prev => prev.map((x, j) => j === i ? v : x))}
                  onDelete={() => setPrompts(prev => prev.filter((_, j) => j !== i))} />
              ))}
              {prompts.length < 6 && (
                <div className="flex gap-2">
                  <input type="text" placeholder="프롬프트 직접 추가"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm"
                    value={newPrompt} onChange={e => setNewPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPrompt())} />
                  <button onClick={addPrompt} disabled={!newPrompt.trim()}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 disabled:bg-slate-200 transition-all">
                    <Plus size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>}

        <button onClick={run}
          disabled={isRunning || !company.trim() || !industry.trim() || prompts.length === 0}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-200 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
          {isRunning ? (
            <><Loader2 size={18} className="animate-spin" /> {prompts.length}개 프롬프트 분석 중…</>
          ) : (
            <><Megaphone size={18} /> AI Share of Voice 측정 시작</>
          )}
        </button>
        {isRunning && <p className="text-center text-xs text-slate-400 mt-2">Gemini에 프롬프트를 병렬로 전송 중입니다. 약 10~20초 소요됩니다.</p>}
      </Card>

      {/* 결과 */}
      {result && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <MentionGauge rate={result.mentionRate} company={result.company} />
              <div className="flex-1 w-full">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart2 size={18} className="text-slate-600" />
                  브랜드별 AI 언급율 비교
                </h4>
                <div className="space-y-3">
                  {allBrands.map((b, i) => (
                    <div key={b.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full inline-block ${i === 0 ? 'bg-slate-900' : 'bg-slate-300'}`} />
                          {b.name}
                        </span>
                        <span className={`text-sm font-black ${i === 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                          {b.mentionRate}% ({b.mentionCount}/{result.totalPrompts})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full transition-all duration-1000 ${i === 0 ? 'bg-slate-900' : 'bg-slate-300'}`}
                          style={{ width: (b.mentionRate / maxRate * 100) + '%' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="text-xl font-black text-slate-800">{result.mentionCount}<span className="text-sm text-slate-400">/{result.totalPrompts}</span></div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">언급 횟수</div>
                  </div>
                  <div className="text-center p-3 bg-slate-900 rounded-xl">
                    <div className="text-xl font-black text-white">{result.mentionRate}%</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">AI 언급율</div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <div className="text-xl font-black text-slate-800">{result.competitorSummary.length}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">비교 경쟁사</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4">프롬프트별 언급 결과</h4>
            <div className="space-y-2">
              {result.results.map((r, i) => <PromptRow key={i} r={r} index={i} />)}
            </div>
          </Card>

          {result.insights && (
            <Card className="p-6">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-slate-600" />
                AI 가시성 개선 인사이트
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                {result.insights}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* 측정 이력 */}
      {history.length > 0 && (
        <Card className="p-6">
          <button onClick={() => setShowHistory(o => !o)} className="w-full flex items-center justify-between">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" />
              측정 이력 ({history.length}건)
            </h4>
            {showHistory ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
          {showHistory && (
            <div className="mt-4 space-y-2">
              {history.map((h, i) => {
                const rate = h.mentionRate;
                return (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm font-black px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700">{rate}%</span>
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
