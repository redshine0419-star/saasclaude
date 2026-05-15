'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Loader2, AlertCircle, ChevronDown, Flag, Calendar, User2,
  GripVertical, X, Pencil, LayoutGrid, GanttChartSquare,
  Settings2, Trash2, Check, Star, Link, Download, ClipboardList, Eye,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WorkUser { id: string; name: string | null; email: string; avatarUrl: string | null }
interface SubTask {
  id: string; title: string;
  startDate: string | null; dueDate: string | null;
  status: string;
  assignee: WorkUser | null;
}
interface Task {
  id: string; title: string; description: string | null;
  status: string; priority: string;
  startDate: string | null; dueDate: string | null;
  position: number; createdAt: string;
  isKeyTask: boolean;
  category: string; taskType: string; requester: string; externalLink: string;
  planningStatus: string; planningStartDate: string | null; planningDueDate: string | null;
  designStatus: string; designStartDate: string | null; designDueDate: string | null;
  publishStatus: string; publishStartDate: string | null; publishDueDate: string | null;
  devStatus: string; devStartDate: string | null; devDueDate: string | null;
  assignee: WorkUser | null;
  _count: { comments: number };
  subTasks: SubTask[];
}
interface Project { id: string; name: string; color: string }
interface Member { id: string; role: string; user: WorkUser }
interface Stage { id: string; label: string; color: string }

type ViewMode = 'card' | 'gantt' | 'ops';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_STAGES: Stage[] = [
  { id: '기획', label: '기획', color: '#8b5cf6' },
  { id: '디자인', label: '디자인', color: '#0969da' },
  { id: '퍼블', label: '퍼블', color: '#f97316' },
  { id: '개발', label: '개발', color: '#14b8a6' },
  { id: '완료', label: '완료', color: '#1a7f37' },
];
const STAGE_COLOR_OPTIONS = [
  '#8c959f','#0969da','#bf8700','#1a7f37','#ef4444','#f97316','#8b5cf6','#ec4899','#14b8a6',
];
const STAGE_STATUS_OPTIONS = ['미시작','진행중','검토요청','피드백','보류','완료','N/A'];
const PRIORITY_VALUES = ['낮음','보통','높음','긴급'];
const DEFAULT_CATEGORIES = ['어학연수','해외대학','조기유학/캠프','아트포폴','견적시스템','기타'];
const DEFAULT_TASK_TYPES = ['기능개선','프로그램_신규','프로그램_수정','오류','기타 유지보수','검토요청','프로젝트'];
const OPS_ALL_COLS = ['단계','시작일','목표일','담당','구분','작업종류','중요도','기획','기획시작','기획목표','디자인','디자인시작','디자인목표','퍼블','퍼블시작','퍼블목표','개발','개발시작','개발목표','요청자','링크','설명'];
const STAGE_STATUS_COLORS: Record<string, string> = {
  '미시작': 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e]',
  '진행중': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  '검토요청': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  '피드백': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  '보류': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  '완료': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'N/A': 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#8c959f] line-through',
};
const PRIORITY_COLORS: Record<string, string> = {
  긴급: '#ef4444', 높음: '#f97316', 보통: '#eab308', 낮음: '#94a3b8',
  urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#94a3b8',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStages(pid: string): Stage[] {
  try { const r = localStorage.getItem(`work-stages-${pid}`); return r ? JSON.parse(r) : DEFAULT_STAGES; } catch { return DEFAULT_STAGES; }
}
function saveStages(pid: string, s: Stage[]) { localStorage.setItem(`work-stages-${pid}`, JSON.stringify(s)); }
function getCategories(): string[] {
  try { const r = localStorage.getItem('work-categories'); return r ? JSON.parse(r) : DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
}
function saveCategories(v: string[]) { localStorage.setItem('work-categories', JSON.stringify(v)); }
function getTaskTypes(): string[] {
  try { const r = localStorage.getItem('work-tasktypes'); return r ? JSON.parse(r) : DEFAULT_TASK_TYPES; } catch { return DEFAULT_TASK_TYPES; }
}
function saveTaskTypes(v: string[]) { localStorage.setItem('work-tasktypes', JSON.stringify(v)); }
function getOpsCols(): string[] {
  try { const r = localStorage.getItem('work-ops-cols'); return r ? JSON.parse(r) : OPS_ALL_COLS; } catch { return OPS_ALL_COLS; }
}
function saveOpsCols(v: string[]) { localStorage.setItem('work-ops-cols', JSON.stringify(v)); }
function genId() { return Math.random().toString(36).slice(2, 9); }
function fmtDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ stages, projectId, onClose, onSaveStages }: {
  stages: Stage[]; projectId: string; onClose: () => void;
  onSaveStages: (s: Stage[]) => void;
}) {
  const [tab, setTab] = useState<'stages'|'categories'|'tasktypes'>('stages');
  const [stageList, setStageList] = useState<Stage[]>(stages);
  const [newStageLabel, setNewStageLabel] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [cats, setCats] = useState<string[]>(getCategories);
  const [types, setTypes] = useState<string[]>(getTaskTypes);
  const [newCat, setNewCat] = useState('');
  const [newType, setNewType] = useState('');

  const handleSave = () => {
    onSaveStages(stageList);
    saveStages(projectId, stageList);
    saveCategories(cats);
    saveTaskTypes(types);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#d0d7de] dark:border-[#30363d]">
          <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">설정</h2>
          <button onClick={onClose}><X size={18} className="text-[#57606a]" /></button>
        </div>
        <div className="flex border-b border-[#d0d7de] dark:border-[#30363d]">
          {(['stages','categories','tasktypes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===t ? 'border-[#0969da] text-[#0969da]' : 'border-transparent text-[#57606a] hover:text-[#24292f] dark:hover:text-[#e6edf3]'}`}>
              {t==='stages'?'단계 관리':t==='categories'?'구분 관리':'작업종류 관리'}
            </button>
          ))}
        </div>
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
          {tab === 'stages' && (
            <>
              {stageList.map((s,i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs text-[#8c959f] w-4">{i+1}</span>
                  <div className="relative group/c">
                    <div className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-sm" style={{backgroundColor:s.color}}/>
                    <div className="absolute left-0 top-8 z-10 hidden group-hover/c:flex flex-wrap gap-1 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-2 rounded-lg shadow-lg w-40">
                      {STAGE_COLOR_OPTIONS.map(c=>(
                        <button key={c} onClick={()=>setStageList(l=>l.map(x=>x.id===s.id?{...x,color:c}:x))}
                          className={`w-6 h-6 rounded-full border-2 ${s.color===c?'border-[#0969da]':'border-transparent'}`} style={{backgroundColor:c}}/>
                      ))}
                    </div>
                  </div>
                  <input value={s.label} onChange={e=>setStageList(l=>l.map(x=>x.id===s.id?{...x,label:e.target.value}:x))}
                    className="flex-1 px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                  <button onClick={()=>setStageList(l=>l.filter(x=>x.id!==s.id))} disabled={stageList.length<=1} className="text-[#8c959f] hover:text-red-500 disabled:opacity-30"><Trash2 size={14}/></button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
                <span className="w-4"/>
                <div className="relative group/nc">
                  <div className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-sm" style={{backgroundColor:newStageColor}}/>
                  <div className="absolute left-0 top-8 z-10 hidden group-hover/nc:flex flex-wrap gap-1 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-2 rounded-lg shadow-lg w-40">
                    {STAGE_COLOR_OPTIONS.map(c=>(
                      <button key={c} onClick={()=>setNewStageColor(c)}
                        className={`w-6 h-6 rounded-full border-2 ${newStageColor===c?'border-[#0969da]':'border-transparent'}`} style={{backgroundColor:c}}/>
                    ))}
                  </div>
                </div>
                <input value={newStageLabel} onChange={e=>setNewStageLabel(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&newStageLabel.trim()){setStageList(l=>[...l,{id:genId(),label:newStageLabel.trim(),color:newStageColor}]);setNewStageLabel('');}}}
                  placeholder="새 단계 이름..."
                  className="flex-1 px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                <button onClick={()=>{if(newStageLabel.trim()){setStageList(l=>[...l,{id:genId(),label:newStageLabel.trim(),color:newStageColor}]);setNewStageLabel('');}}} disabled={!newStageLabel.trim()} className="text-[#0969da] hover:text-[#0860ca] disabled:opacity-30"><Plus size={16}/></button>
              </div>
            </>
          )}
          {tab === 'categories' && (
            <>
              {cats.map((c,i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-2 py-1.5 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3]">{c}</span>
                  <button onClick={()=>setCats(v=>v.filter((_,j)=>j!==i))} className="text-[#8c959f] hover:text-red-500"><X size={14}/></button>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
                <input value={newCat} onChange={e=>setNewCat(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&newCat.trim()){setCats(v=>[...v,newCat.trim()]);setNewCat('');}}}
                  placeholder="새 구분..."
                  className="flex-1 px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                <button onClick={()=>{if(newCat.trim()){setCats(v=>[...v,newCat.trim()]);setNewCat('');}}} disabled={!newCat.trim()} className="px-3 py-1.5 bg-[#0969da] text-white text-sm rounded-lg disabled:opacity-50"><Plus size={14}/></button>
              </div>
            </>
          )}
          {tab === 'tasktypes' && (
            <>
              {types.map((t,i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-2 py-1.5 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3]">{t}</span>
                  <button onClick={()=>setTypes(v=>v.filter((_,j)=>j!==i))} className="text-[#8c959f] hover:text-red-500"><X size={14}/></button>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
                <input value={newType} onChange={e=>setNewType(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&newType.trim()){setTypes(v=>[...v,newType.trim()]);setNewType('');}}}
                  placeholder="새 작업종류..."
                  className="flex-1 px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                <button onClick={()=>{if(newType.trim()){setTypes(v=>[...v,newType.trim()]);setNewType('');}}} disabled={!newType.trim()} className="px-3 py-1.5 bg-[#0969da] text-white text-sm rounded-lg disabled:opacity-50"><Plus size={14}/></button>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#57606a]">취소</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#0969da] text-white text-sm font-medium rounded-lg"><Check size={14}/>적용</button>
        </div>
      </div>
    </div>
  );
}

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ task, members, stages, onClose, onSave }: {
  task: Task | null; members: WorkUser[]; stages: Stage[];
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
}) {
  const cats = getCategories();
  const types = getTaskTypes();
  const isNew = !task;
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? stages[0]?.id ?? '기획',
    priority: task?.priority ?? '보통',
    startDate: task?.startDate ? task.startDate.slice(0,10) : '',
    dueDate: task?.dueDate ? task.dueDate.slice(0,10) : '',
    assigneeId: task?.assignee?.id ?? '',
    isKeyTask: task?.isKeyTask ?? false,
    category: task?.category ?? '',
    taskType: task?.taskType ?? '',
    requester: task?.requester ?? '',
    externalLink: task?.externalLink ?? '',
    planningStatus: task?.planningStatus ?? '미시작',
    planningStartDate: task?.planningStartDate ? task.planningStartDate.slice(0,10) : '',
    planningDueDate: task?.planningDueDate ? task.planningDueDate.slice(0,10) : '',
    designStatus: task?.designStatus ?? '미시작',
    designStartDate: task?.designStartDate ? task.designStartDate.slice(0,10) : '',
    designDueDate: task?.designDueDate ? task.designDueDate.slice(0,10) : '',
    publishStatus: task?.publishStatus ?? '미시작',
    publishStartDate: task?.publishStartDate ? task.publishStartDate.slice(0,10) : '',
    publishDueDate: task?.publishDueDate ? task.publishDueDate.slice(0,10) : '',
    devStatus: task?.devStatus ?? '미시작',
    devStartDate: task?.devStartDate ? task.devStartDate.slice(0,10) : '',
    devDueDate: task?.devDueDate ? task.devDueDate.slice(0,10) : '',
  });
  const [subTasks, setSubTasks] = useState<Array<{id:string;tempId?:string;title:string;startDate:string;dueDate:string;status:string;assigneeId:string;isNew?:boolean}>>(
    task?.subTasks.map(st=>({id:st.id,title:st.title,startDate:st.startDate?.slice(0,10)??'',dueDate:st.dueDate?.slice(0,10)??'',status:st.status,assigneeId:st.assignee?.id??''})) ?? []
  );
  const [deletedSubTaskIds, setDeletedSubTaskIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [stageOpen, setStageOpen] = useState(true);

  const set = (k: string, v: unknown) => setForm(f => ({...f, [k]: v}));

  const addSubTask = () => {
    setSubTasks(s => [...s, {id: genId(), tempId: genId(), title:'', startDate:'', dueDate:'', status:'미시작', assigneeId:'', isNew: true}]);
  };
  const removeSubTask = (id: string, isNew?: boolean) => {
    if (!isNew) setDeletedSubTaskIds(d => [...d, id]);
    setSubTasks(s => s.filter(st => st.id !== id));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      // Save/delete sub-tasks
      for (const id of deletedSubTaskIds) {
        await fetch(`/api/work/subtasks?id=${id}`, { method: 'DELETE' });
      }
      for (const st of subTasks) {
        if (!st.title.trim()) continue;
        if (st.isNew && task) {
          await fetch('/api/work/subtasks', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({taskId: task.id, title: st.title, startDate: st.startDate||null, dueDate: st.dueDate||null, status: st.status, assigneeId: st.assigneeId||null}),
          });
        } else if (!st.isNew) {
          await fetch('/api/work/subtasks', {
            method: 'PATCH', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({id: st.id, title: st.title, startDate: st.startDate||null, dueDate: st.dueDate||null, status: st.status, assigneeId: st.assigneeId||null}),
          });
        }
      }
      await onSave({
        ...form,
        description: form.description || null,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
        planningStartDate: form.planningStartDate || null,
        planningDueDate: form.planningDueDate || null,
        designStartDate: form.designStartDate || null,
        designDueDate: form.designDueDate || null,
        publishStartDate: form.publishStartDate || null,
        publishDueDate: form.publishDueDate || null,
        devStartDate: form.devStartDate || null,
        devDueDate: form.devDueDate || null,
        _newSubTasks: task ? [] : subTasks.filter(st=>st.title.trim()),
      });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da]";
  const labelCls = "block text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-1.5";
  const selCls = inputCls + " appearance-none pr-8 cursor-pointer";

  const STAGE_ROWS = [
    {key:'planning', label:'기획', statusKey:'planningStatus', startKey:'planningStartDate', dueKey:'planningDueDate'},
    {key:'design', label:'디자인', statusKey:'designStatus', startKey:'designStartDate', dueKey:'designDueDate'},
    {key:'publish', label:'퍼블', statusKey:'publishStatus', startKey:'publishStartDate', dueKey:'publishDueDate'},
    {key:'dev', label:'개발', statusKey:'devStatus', startKey:'devStartDate', dueKey:'devDueDate'},
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#d0d7de] dark:border-[#30363d] shrink-0">
          <h2 className="font-semibold text-[#24292f] dark:text-[#e6edf3]">{isNew ? '업무 추가' : '업무 편집'}</h2>
          <button onClick={onClose}><X size={18} className="text-[#57606a]"/></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Title + Key task */}
          <div>
            <label className={labelCls}>제목 *</label>
            <div className="flex gap-2">
              <input autoFocus value={form.title} onChange={e=>set('title',e.target.value)} placeholder="업무 제목" className={inputCls + " flex-1"} />
              <button onClick={()=>set('isKeyTask',!form.isKeyTask)} title="주요 업무"
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form.isKeyTask ? 'bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-400' : 'border-[#d0d7de] dark:border-[#30363d] text-[#57606a]'}`}>
                <Star size={14} fill={form.isKeyTask ? 'currentColor' : 'none'}/>
              </button>
            </div>
          </div>
          {/* Description */}
          <div>
            <label className={labelCls}>설명</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} placeholder="업무 설명..."
              className={inputCls + " resize-none"} />
          </div>
          {/* Row: 단계 / 중요도 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>단계</label>
              <div className="relative">
                <select value={form.status} onChange={e=>set('status',e.target.value)} className={selCls}>
                  {stages.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className={labelCls}>중요도</label>
              <div className="relative">
                <select value={form.priority} onChange={e=>set('priority',e.target.value)} className={selCls}>
                  {PRIORITY_VALUES.map(v=><option key={v} value={v}>{v}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none"/>
              </div>
            </div>
          </div>
          {/* Row: 시작일 / 목표일 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>시작일</label>
              <input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className={labelCls}>목표일</label>
              <input type="date" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)} className={inputCls}/>
            </div>
          </div>
          {/* Row: 담당자 / 요청자 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>담당자</label>
              <div className="relative">
                <select value={form.assigneeId} onChange={e=>set('assigneeId',e.target.value)} className={selCls}>
                  <option value="">배정 안 함</option>
                  {members.map(m=><option key={m.id} value={m.id}>{m.name??m.email.split('@')[0]}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className={labelCls}>요청자</label>
              <input value={form.requester} onChange={e=>set('requester',e.target.value)} placeholder="요청자 이름" className={inputCls}/>
            </div>
          </div>
          {/* Row: 구분 / 작업종류 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>구분</label>
              <div className="relative">
                <select value={form.category} onChange={e=>set('category',e.target.value)} className={selCls}>
                  <option value="">선택 안 함</option>
                  {cats.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className={labelCls}>작업종류</label>
              <div className="relative">
                <select value={form.taskType} onChange={e=>set('taskType',e.target.value)} className={selCls}>
                  <option value="">선택 안 함</option>
                  {types.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none"/>
              </div>
            </div>
          </div>
          {/* 외부 링크 */}
          <div>
            <label className={labelCls}>외부 링크</label>
            <input value={form.externalLink} onChange={e=>set('externalLink',e.target.value)} placeholder="https://..." className={inputCls}/>
          </div>
          {/* 단계별 상태 */}
          <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
            <button onClick={()=>setStageOpen(v=>!v)} className="flex items-center justify-between w-full px-4 py-3 bg-[#f6f8fa] dark:bg-[#21262d] text-sm font-semibold text-[#24292f] dark:text-[#e6edf3]">
              <span>단계별 상태</span>
              <ChevronDown size={14} className={`transition-transform ${stageOpen?'rotate-180':''}`}/>
            </button>
            {stageOpen && (
              <div className="p-4 space-y-3">
                {STAGE_ROWS.map(r => (
                  <div key={r.key} className="grid grid-cols-3 gap-2 items-center">
                    <div>
                      <p className="text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">{r.label}</p>
                      <div className="relative">
                        <select value={(form as Record<string,unknown>)[r.statusKey] as string} onChange={e=>set(r.statusKey,e.target.value)}
                          className="w-full appearance-none px-2 py-1.5 pr-6 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da] cursor-pointer">
                          {STAGE_STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none"/>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">시작일</p>
                      <input type="date" value={(form as Record<string,unknown>)[r.startKey] as string} onChange={e=>set(r.startKey,e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#57606a] dark:text-[#8b949e] mb-1">목표일</p>
                      <input type="date" value={(form as Record<string,unknown>)[r.dueKey] as string} onChange={e=>set(r.dueKey,e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 하위 업무 */}
          <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f6f8fa] dark:bg-[#21262d]">
              <span className="text-sm font-semibold text-[#24292f] dark:text-[#e6edf3]">하위 업무 ({subTasks.length})</span>
              <button onClick={addSubTask} className="flex items-center gap-1 text-xs text-[#0969da] hover:text-[#0860ca]"><Plus size={12}/>추가</button>
            </div>
            {subTasks.length > 0 && (
              <div className="p-3 space-y-2">
                {subTasks.map(st => (
                  <div key={st.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                    <input value={st.title} onChange={e=>setSubTasks(s=>s.map(x=>x.id===st.id?{...x,title:e.target.value}:x))}
                      placeholder="하위 업무 제목"
                      className="px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                    <input type="date" value={st.startDate} onChange={e=>setSubTasks(s=>s.map(x=>x.id===st.id?{...x,startDate:e.target.value}:x))}
                      className="px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                    <input type="date" value={st.dueDate} onChange={e=>setSubTasks(s=>s.map(x=>x.id===st.id?{...x,dueDate:e.target.value}:x))}
                      className="px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da]"/>
                    <select value={st.status} onChange={e=>setSubTasks(s=>s.map(x=>x.id===st.id?{...x,status:e.target.value}:x))}
                      className="px-2 py-1.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-[#0969da]">
                      {STAGE_STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={()=>removeSubTask(st.id, st.isNew)} className="text-[#8c959f] hover:text-red-500"><X size={13}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#d0d7de] dark:border-[#30363d] shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#57606a]">취소</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0969da] text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin"/>}저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline Status Badge ───────────────────────────────────────────────────────
function StageStatusBadge({ status, onChange }: { status: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={()=>setOpen(v=>!v)}
        className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${STAGE_STATUS_COLORS[status] ?? STAGE_STATUS_COLORS['미시작']}`}>
        {status}
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-20 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg shadow-lg py-1 min-w-[90px]">
          {STAGE_STATUS_OPTIONS.map(s=>(
            <button key={s} onClick={()=>{onChange(s);setOpen(false);}}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] ${s===status?'font-semibold text-[#0969da]':'text-[#24292f] dark:text-[#e6edf3]'}`}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Card View ─────────────────────────────────────────────────────────────────
function CardView({ tasks, stages, onEdit, onDelete, onStatusChange }: {
  tasks: Task[]; stages: Stage[];
  onEdit: (t: Task) => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  return (
    <div className="grid gap-4 pb-4 min-w-0" style={{ gridTemplateColumns: `repeat(${Math.min(stages.length, 5)}, minmax(220px, 1fr))` }}>
      {stages.map(col => {
        const colTasks = tasks.filter(t=>t.status===col.id).sort((a,b)=>a.position-b.position);
        return (
          <div key={col.id}
            className={`flex flex-col min-h-[400px] rounded-xl border transition-colors ${dragOver===col.id?'border-[#0969da] bg-[#0969da]/5':'border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]'}`}
            onDragOver={e=>{e.preventDefault();setDragOver(col.id);}}
            onDragLeave={()=>setDragOver(null)}
            onDrop={e=>{e.preventDefault();setDragOver(null);if(dragging)onStatusChange(dragging,col.id);setDragging(null);}}>
            <div className="flex items-center justify-between px-3 py-3 border-b border-[#d0d7de] dark:border-[#30363d]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor:col.color}}/>
                <span className="text-xs font-semibold text-[#24292f] dark:text-[#e6edf3]">{col.label}</span>
                <span className="text-xs text-[#57606a] bg-[#eaeef2] dark:bg-[#30363d] px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <span />
            </div>
            <div className="flex-1 p-2 space-y-2">
              {colTasks.map(task => (
                <div key={task.id} draggable onDragStart={()=>setDragging(task.id)} onDragEnd={()=>setDragging(null)}
                  className={`group bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-[#0969da] dark:hover:border-[#388bfd] transition-all ${dragging===task.id?'opacity-40':''}`}>
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="text-[#8c959f] mt-0.5 shrink-0 opacity-0 group-hover:opacity-100"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1">
                        {task.isKeyTask && <Star size={11} className="text-yellow-500 fill-yellow-500 shrink-0 mt-0.5"/>}
                        <p className="text-sm text-[#24292f] dark:text-[#e6edf3] font-medium leading-snug">{task.title}</p>
                      </div>
                      {task.description && <p className="text-xs text-[#57606a] mt-1 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{backgroundColor:(PRIORITY_COLORS[task.priority]??'#94a3b8')+'22',color:PRIORITY_COLORS[task.priority]??'#94a3b8'}}>
                          <Flag size={9}/>{task.priority}
                        </span>
                        {task.dueDate && <span className="flex items-center gap-1 text-[10px] text-[#57606a]"><Calendar size={9}/>{fmtDate(task.dueDate)}</span>}
                        {task.assignee && <span className="flex items-center gap-1 text-[10px] text-[#57606a] ml-auto"><User2 size={9}/>{task.assignee.name??task.assignee.email.split('@')[0]}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                      <button onClick={()=>onEdit(task)} className="text-[#57606a] hover:text-[#0969da]"><Pencil size={12}/></button>
                      <button onClick={()=>onDelete(task.id)} className="text-[#8c959f] hover:text-red-500"><X size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Gantt View ────────────────────────────────────────────────────────────────
function GanttView({ tasks, stages, onEdit }: { tasks: Task[]; stages: Stage[]; onEdit: (t: Task) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const winStart = new Date(today); winStart.setDate(today.getDate() - 14);
  const winEnd = new Date(today); winEnd.setDate(today.getDate() + 46);
  const totalDays = 60;
  const dayMs = 86400000;
  const stageMap = Object.fromEntries(stages.map(s=>[s.id,s]));

  const pct = (d: Date) => ((d.getTime() - winStart.getTime()) / (totalDays * dayMs)) * 100;
  const todayPct = pct(today);

  const days = Array.from({length: totalDays}, (_,i) => { const d = new Date(winStart); d.setDate(winStart.getDate()+i); return d; });
  const weeks = days.reduce<{label:string;count:number}[]>((acc,d) => {
    const wl = `${d.getMonth()+1}월 ${Math.ceil(d.getDate()/7)}주`;
    if (!acc.length || acc[acc.length-1].label !== wl) acc.push({label:wl,count:1});
    else acc[acc.length-1].count++;
    return acc;
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#d0d7de] dark:border-[#30363d]">
      <div style={{minWidth:900}}>
        <div className="flex border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
          <div className="w-48 shrink-0 px-3 py-2 text-xs font-semibold text-[#57606a] border-r border-[#d0d7de] dark:border-[#30363d]">업무</div>
          <div className="flex-1 relative">
            <div className="flex h-8">
              {weeks.map((w,i) => (
                <div key={i} className="border-r border-[#d0d7de] dark:border-[#30363d] flex items-center justify-center text-[10px] text-[#57606a]"
                  style={{width:`${(w.count/totalDays)*100}%`}}>{w.label}</div>
              ))}
            </div>
          </div>
        </div>
        {tasks.map(task => {
          const start = task.startDate ? new Date(task.startDate) : task.createdAt ? new Date(task.createdAt) : null;
          const end = task.dueDate ? new Date(task.dueDate) : null;
          const stage = stageMap[task.status];
          let barLeft = 0, barWidth = 0;
          let showBar = false;
          if (start && end) {
            const clampedStart = start < winStart ? winStart : start > winEnd ? winEnd : start;
            const clampedEnd = end < winStart ? winStart : end > winEnd ? winEnd : end;
            barLeft = pct(clampedStart);
            barWidth = pct(clampedEnd) - barLeft;
            showBar = barWidth > 0;
          }
          return (
            <div key={task.id} className="flex border-b border-[#d0d7de] dark:border-[#30363d] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]">
              <div className="w-48 shrink-0 px-3 py-2 border-r border-[#d0d7de] dark:border-[#30363d]">
                <button onClick={()=>onEdit(task)} className="flex items-center gap-1 text-xs text-[#24292f] dark:text-[#e6edf3] hover:text-[#0969da] text-left w-full">
                  {task.isKeyTask && <Star size={9} className="text-yellow-500 fill-yellow-500 shrink-0"/>}
                  <span className="truncate">{task.title}</span>
                </button>
              </div>
              <div className="flex-1 relative h-10">
                {todayPct >= 0 && todayPct <= 100 && (
                  <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{left:`${todayPct}%`}}/>
                )}
                {showBar && (
                  <div className="absolute top-2 h-6 rounded-full flex items-center px-2"
                    style={{left:`${barLeft}%`,width:`${Math.max(barWidth,2)}%`,backgroundColor:(stage?.color??'#6366f1')+'cc'}}>
                    <span className="text-[9px] text-white font-medium truncate">{task.title}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="flex">
            <div className="w-48 shrink-0"/>
            <div className="flex-1 text-center py-12 text-sm text-[#57606a]">태스크가 없습니다</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ops View (운영현황) ────────────────────────────────────────────────────────
function OpsView({ tasks, stages, members, onEdit, onDelete, onStatusChange, onAddClick }: {
  tasks: Task[]; stages: Stage[]; members: WorkUser[];
  onEdit: (t: Task) => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, field: string, value: string) => void;
  onAddClick: () => void;
}) {
  const [search, setSearch] = useState('');
  const [visibleCols, setVisibleCols] = useState<string[]>(getOpsCols);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const stageMap = Object.fromEntries(stages.map(s => [s.id, s]));
  const colMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setColMenuOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggleCol = (col: string) => {
    const next = visibleCols.includes(col) ? visibleCols.filter(c=>c!==col) : [...visibleCols, col];
    setVisibleCols(next); saveOpsCols(next);
  };

  const filtered = tasks.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.requester.toLowerCase().includes(q)
      || (t.assignee?.name ?? '').toLowerCase().includes(q) || (t.assignee?.email ?? '').toLowerCase().includes(q);
  });

  const completed = filtered.filter(t => t.devStatus === '완료').length;
  const pct = filtered.length ? Math.round((completed / filtered.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="제목, 요청자, 담당자 검색..."
            className="px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] placeholder-[#8c959f] focus:outline-none focus:ring-2 focus:ring-[#0969da] w-64"/>
          <span className="text-sm text-[#57606a] dark:text-[#8b949e]">
            완료 {completed}/{filtered.length} ({pct}%)
          </span>
          {filtered.length > 0 && (
            <div className="flex-1 h-1.5 bg-[#f6f8fa] dark:bg-[#30363d] rounded-full w-24">
              <div className="h-full bg-green-500 rounded-full" style={{width:`${pct}%`}}/>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Column visibility */}
          <div ref={colMenuRef} className="relative">
            <button onClick={()=>setColMenuOpen(v=>!v)} className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]">
              <Eye size={13}/> 열 설정
            </button>
            {colMenuOpen && (
              <div className="absolute right-0 top-9 z-20 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-lg p-3 w-44">
                {OPS_ALL_COLS.map(col=>(
                  <label key={col} className="flex items-center gap-2 px-1 py-1.5 hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] rounded cursor-pointer">
                    <input type="checkbox" checked={visibleCols.includes(col)} onChange={()=>toggleCol(col)} className="rounded"/>
                    <span className="text-sm text-[#24292f] dark:text-[#e6edf3]">{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={onAddClick}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1f2328] dark:bg-[#f0f6fc] text-white dark:text-[#1f2328] text-sm font-medium rounded-lg hover:opacity-90">
            <Plus size={14}/> 업무 추가
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#d0d7de] dark:border-[#30363d]">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
            <tr>
              <th className="text-left px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider min-w-[200px] sticky left-0 bg-[#f6f8fa] dark:bg-[#161b22] z-10">업무내용</th>
              {visibleCols.includes('단계') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">단계</th>}
              {visibleCols.includes('시작일') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">시작일</th>}
              {visibleCols.includes('목표일') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">목표일</th>}
              {visibleCols.includes('담당') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">담당</th>}
              {visibleCols.includes('구분') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">구분</th>}
              {visibleCols.includes('작업종류') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">작업종류</th>}
              {visibleCols.includes('중요도') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">중요도</th>}
              {visibleCols.includes('기획') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">기획</th>}
              {visibleCols.includes('기획시작') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">기획시작</th>}
              {visibleCols.includes('기획목표') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">기획목표</th>}
              {visibleCols.includes('디자인') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">디자인</th>}
              {visibleCols.includes('디자인시작') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">디자인시작</th>}
              {visibleCols.includes('디자인목표') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">디자인목표</th>}
              {visibleCols.includes('퍼블') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">퍼블</th>}
              {visibleCols.includes('퍼블시작') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">퍼블시작</th>}
              {visibleCols.includes('퍼블목표') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">퍼블목표</th>}
              {visibleCols.includes('개발') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">개발</th>}
              {visibleCols.includes('개발시작') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">개발시작</th>}
              {visibleCols.includes('개발목표') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">개발목표</th>}
              {visibleCols.includes('요청자') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">요청자</th>}
              {visibleCols.includes('링크') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider whitespace-nowrap text-left">링크</th>}
              {visibleCols.includes('설명') && <th className="px-3 py-3 text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider text-left min-w-[160px]">설명</th>}
              <th className="w-16"/>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]/50 group">
                <td className="px-3 py-2.5 sticky left-0 bg-white dark:bg-[#0d1117] group-hover:bg-[#f6f8fa] dark:group-hover:bg-[#161b22]/50 z-10">
                  <div className="flex items-center gap-1.5">
                    {t.isKeyTask && <Star size={11} className="text-yellow-500 fill-yellow-500 shrink-0"/>}
                    <button onClick={()=>onEdit(t)} className="text-sm text-[#24292f] dark:text-[#e6edf3] hover:text-[#0969da] text-left line-clamp-2">{t.title}</button>
                  </div>
                </td>
                {visibleCols.includes('단계') && (
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                      style={{backgroundColor:(stageMap[t.status]?.color??'#8c959f')+'22',color:stageMap[t.status]?.color??'#8c959f'}}>
                      {t.status}
                    </span>
                  </td>
                )}
                {visibleCols.includes('시작일') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.startDate)}</td>}
                {visibleCols.includes('목표일') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.dueDate)}</td>}
                {visibleCols.includes('담당') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{t.assignee?.name ?? t.assignee?.email.split('@')[0] ?? ''}</td>}
                {visibleCols.includes('구분') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e]">{t.category}</td>}
                {visibleCols.includes('작업종류') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e]">{t.taskType}</td>}
                {visibleCols.includes('중요도') && (
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap"
                      style={{backgroundColor:(PRIORITY_COLORS[t.priority]??'#94a3b8')+'22',color:PRIORITY_COLORS[t.priority]??'#94a3b8'}}>
                      {t.priority}
                    </span>
                  </td>
                )}
                {visibleCols.includes('기획') && <td className="px-3 py-2.5"><StageStatusBadge status={t.planningStatus} onChange={v=>onStatusChange(t.id,'planningStatus',v)}/></td>}
                {visibleCols.includes('기획시작') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.planningStartDate)}</td>}
                {visibleCols.includes('기획목표') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.planningDueDate)}</td>}
                {visibleCols.includes('디자인') && <td className="px-3 py-2.5"><StageStatusBadge status={t.designStatus} onChange={v=>onStatusChange(t.id,'designStatus',v)}/></td>}
                {visibleCols.includes('디자인시작') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.designStartDate)}</td>}
                {visibleCols.includes('디자인목표') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.designDueDate)}</td>}
                {visibleCols.includes('퍼블') && <td className="px-3 py-2.5"><StageStatusBadge status={t.publishStatus} onChange={v=>onStatusChange(t.id,'publishStatus',v)}/></td>}
                {visibleCols.includes('퍼블시작') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.publishStartDate)}</td>}
                {visibleCols.includes('퍼블목표') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.publishDueDate)}</td>}
                {visibleCols.includes('개발') && <td className="px-3 py-2.5"><StageStatusBadge status={t.devStatus} onChange={v=>onStatusChange(t.id,'devStatus',v)}/></td>}
                {visibleCols.includes('개발시작') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.devStartDate)}</td>}
                {visibleCols.includes('개발목표') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] whitespace-nowrap">{fmtDate(t.devDueDate)}</td>}
                {visibleCols.includes('요청자') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e]">{t.requester}</td>}
                {visibleCols.includes('링크') && <td className="px-3 py-2.5">
                  {t.externalLink && <a href={t.externalLink} target="_blank" rel="noreferrer" className="text-[#0969da] hover:underline"><Link size={12}/></a>}
                </td>}
                {visibleCols.includes('설명') && <td className="px-3 py-2.5 text-xs text-[#57606a] dark:text-[#8b949e] max-w-[200px] truncate">{t.description}</td>}
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100">
                    <button onClick={()=>onEdit(t)} className="text-[#57606a] hover:text-[#0969da]"><Pencil size={13}/></button>
                    <button onClick={()=>onDelete(t.id)} className="text-[#8c959f] hover:text-red-500"><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={15} className="text-center py-12 text-sm text-[#57606a] dark:text-[#8b949e]">{search ? '검색 결과가 없습니다' : '태스크가 없습니다'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WorkKanbanTab({ projectId, onChangeProject }: {
  projectId: string | null;
  onChangeProject: (id: string | null) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkUser[]>([]);
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [showSettings, setShowSettings] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/work/tasks?projectId=${projectId}`);
      if (!r.ok) throw new Error('태스크 로딩 실패');
      setTasks(await r.json());
    } catch (e) { setError(e instanceof Error ? e.message : '오류'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => {
    fetch('/api/work/projects').then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setProjects(d); });
  }, []);

  useEffect(() => {
    if (!projectId) { setTasks([]); return; }
    setStages(getStages(projectId));
    fetchTasks();
    fetch(`/api/work/members?projectId=${projectId}`).then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setMembers(d.map((m: Member) => m.user)); });
  }, [projectId, fetchTasks]);

  const handleSaveTask = async (updates: Record<string, unknown>) => {
    if (!projectId) return;
    if (editingTask === 'new') {
      const newSubTasks = updates._newSubTasks as Array<{title:string;startDate:string;dueDate:string;status:string;assigneeId:string}> | undefined;
      delete updates._newSubTasks;
      const r = await fetch('/api/work/tasks', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ projectId, ...updates }),
      });
      if (r.ok) {
        const t = await r.json();
        if (newSubTasks) {
          for (const st of newSubTasks) {
            if (!st.title.trim()) continue;
            await fetch('/api/work/subtasks', {
              method: 'POST', headers: {'Content-Type':'application/json'},
              body: JSON.stringify({taskId: t.id, title: st.title, startDate: st.startDate||null, dueDate: st.dueDate||null, status: st.status, assigneeId: st.assigneeId||null}),
            });
          }
        }
        await fetchTasks();
      }
    } else if (editingTask && typeof editingTask === 'object') {
      delete updates._newSubTasks;
      await fetch('/api/work/tasks', {
        method: 'PATCH', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ id: editingTask.id, ...updates }),
      });
      await fetchTasks();
    }
    setEditingTask(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 태스크를 삭제할까요?')) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    await fetch(`/api/work/tasks?id=${id}`, { method: 'DELETE' });
  };

  const handleStatusChange = async (id: string, status: string) => {
    setTasks(prev => prev.map(t => t.id === id ? {...t, status} : t));
    await fetch('/api/work/tasks', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, status }) });
  };

  const handleFieldChange = async (id: string, field: string, value: string) => {
    setTasks(prev => prev.map(t => t.id === id ? {...t, [field]: value} : t));
    await fetch('/api/work/tasks', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, [field]: value }) });
  };

  const handleSaveStages = (s: Stage[]) => { setStages(s); if (projectId) saveStages(projectId, s); };

  const downloadExcel = () => {
    const url = `/api/work/excel?type=tasks${projectId ? `&projectId=${projectId}` : ''}`;
    window.open(url, '_blank');
  };

  const VIEW_BTNS = [
    { mode: 'card' as ViewMode, icon: <LayoutGrid size={14}/>, label: '카드' },
    { mode: 'gantt' as ViewMode, icon: <GanttChartSquare size={14}/>, label: '간트' },
    { mode: 'ops' as ViewMode, icon: <ClipboardList size={14}/>, label: '목록' },
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
        {/* Project selector */}
        <div className="relative">
          <select value={projectId ?? ''}
            onChange={e => onChangeProject(e.target.value || null)}
            className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-sm text-[#24292f] dark:text-[#e6edf3] focus:outline-none focus:ring-2 focus:ring-[#0969da] cursor-pointer font-medium">
            <option value="">프로젝트 선택...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#57606a] pointer-events-none"/>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-1">
          {VIEW_BTNS.map(b => (
            <button key={b.mode} onClick={() => setViewMode(b.mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${viewMode===b.mode ? 'bg-white dark:bg-[#0d1117] text-[#24292f] dark:text-[#e6edf3] shadow-sm' : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3]'}`}>
              {b.icon}{b.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} title="설정"
            className="p-2 text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] rounded-lg border border-[#d0d7de] dark:border-[#30363d] transition-colors">
            <Settings2 size={15}/>
          </button>
          <button onClick={downloadExcel} title="엑셀 다운로드"
            className="p-2 text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] rounded-lg border border-[#d0d7de] dark:border-[#30363d] transition-colors">
            <Download size={15}/>
          </button>
          {viewMode !== 'ops' && (
            <button onClick={() => setEditingTask('new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1f2328] dark:bg-[#f0f6fc] text-white dark:text-[#1f2328] text-sm font-medium rounded-lg hover:opacity-90">
              <Plus size={15}/>업무 추가
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!projectId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={40} className="mx-auto text-[#8c959f] dark:text-[#484f58] mb-3"/>
            <p className="text-[#57606a] dark:text-[#8b949e] font-medium">프로젝트를 선택해주세요</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#57606a] dark:text-[#8b949e]"/>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={40} className="mx-auto text-red-400 mb-3"/>
            <p className="text-red-500">{error}</p>
            <button onClick={fetchTasks} className="mt-2 text-sm text-[#0969da]">다시 시도</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {viewMode === 'card' && (
            <CardView tasks={tasks} stages={stages}
              onEdit={t => setEditingTask(t)} onDelete={handleDelete}
              onStatusChange={handleStatusChange}/>
          )}
          {viewMode === 'gantt' && (
            <GanttView tasks={tasks} stages={stages} onEdit={t => setEditingTask(t)}/>
          )}
          {viewMode === 'ops' && (
            <OpsView tasks={tasks} stages={stages} members={members}
              onEdit={t => setEditingTask(t)} onDelete={handleDelete}
              onStatusChange={handleFieldChange} onAddClick={() => setEditingTask('new')}/>
          )}
        </div>
      )}

      {/* Task Modal */}
      {editingTask !== null && (
        <TaskModal
          task={editingTask === 'new' ? null : editingTask}
          members={members} stages={stages}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}/>
      )}

      {/* Settings Modal */}
      {showSettings && projectId && (
        <SettingsModal stages={stages} projectId={projectId} onClose={() => setShowSettings(false)} onSaveStages={handleSaveStages}/>
      )}
    </div>
  );
}
