'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Zap, Globe, FileText, Clock, AlertTriangle, CheckSquare, ListTodo } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { getDiagnoses, getStats, DiagnosisRecord, UsageStats } from '@/lib/storage';
import { useAppLang } from '@/components/AppLangContext';
import { t, AppLang } from '@/lib/app-i18n';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

function timeAgo(ts: number, lang: AppLang): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('dashboard', 'justNow', lang);
  const minSuffix = t('dashboard', 'minutesAgo', lang);
  if (m < 60) return lang === 'en' ? `${m} ${minSuffix}` : `${m}${minSuffix}`;
  const h = Math.floor(m / 60);
  const hrSuffix = t('dashboard', 'hoursAgo', lang);
  if (h < 24) return lang === 'en' ? `${h} ${hrSuffix}` : `${h}${hrSuffix}`;
  const days = Math.floor(h / 24);
  const daySuffix = t('dashboard', 'daysAgo', lang);
  return lang === 'en' ? `${days} ${daySuffix}` : `${days}${daySuffix}`;
}

function buildChartData(diagnoses: DiagnosisRecord[]) {
  const map: Record<string, { perf: number[]; seo: number[]; geo: number[] }> = {};
  diagnoses.forEach((d) => {
    const date = new Date(d.timestamp);
    const key = (date.getMonth() + 1) + '/' + date.getDate();
    if (!map[key]) map[key] = { perf: [], seo: [], geo: [] };
    map[key].perf.push(d.scores.performance);
    map[key].seo.push(d.scores.seo);
    map[key].geo.push(d.scores.geo);
  });
  return Object.entries(map)
    .slice(-7)
    .map(([day, v]) => ({
      day,
      performance: Math.round(v.perf.reduce((a, b) => a + b, 0) / v.perf.length),
      seo: Math.round(v.seo.reduce((a, b) => a + b, 0) / v.seo.length),
      geo: Math.round(v.geo.reduce((a, b) => a + b, 0) / v.geo.length),
    }));
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-rose-500';
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
  return <span className={'text-[10px] font-black px-2 py-0.5 rounded-full ' + color}>{score}</span>;
}

interface WorkTask {
  id: string;
  status: string;
  dueDate: string | null;
  priority: string;
  isKeyTask: boolean;
  project: { id: string; name: string; color: string } | null;
}

function useWorkStats() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  useEffect(() => {
    fetch('/api/work/tasks?assignedToMe=true')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setTasks(data); })
      .catch(() => {});
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0,10);

  const active = tasks.filter(t => t.status !== '완료');
  const overdue = active.filter(t => t.dueDate && new Date(t.dueDate) < today);
  const dueToday = active.filter(t => t.dueDate && t.dueDate.slice(0,10) === todayStr);
  const keyTasks = active.filter(t => t.isKeyTask);

  return { total: tasks.length, active: active.length, overdue: overdue.length, dueToday: dueToday.length, keyTasks: keyTasks.length };
}

export default function DashboardModule() {
  const { lang } = useAppLang();
  const workStats = useWorkStats();
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [stats, setStats] = useState<UsageStats>({ diagnosisCount: 0, contentCount: 0 });

  useEffect(() => {
    setDiagnoses(getDiagnoses());
    setStats(getStats());
  }, []);

  const chartData = buildChartData(diagnoses);
  const latest = diagnoses[0];

  const radarData = latest
    ? [
        { subject: 'Performance', value: latest.scores.performance },
        { subject: 'SEO', value: latest.scores.seo },
        { subject: 'Accessibility', value: latest.scores.accessibility },
        { subject: 'GEO', value: latest.scores.geo },
      ]
    : [];

  const bestSeo = diagnoses.length > 0 ? Math.max(...diagnoses.map((d) => d.scores.seo)) : 0;
  const bestGeo = diagnoses.length > 0 ? Math.max(...diagnoses.map((d) => d.scores.geo)) : 0;

  if (diagnoses.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-12 flex flex-col items-center text-center">
          <div className="p-4 bg-indigo-100 rounded-2xl mb-4">
            <BarChart3 size={32} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{t('dashboard', 'noData', lang)}</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            {t('dashboard', 'noDataSub', lang)}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Work KPIs */}
      {(workStats.active > 0 || workStats.overdue > 0) && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
            <CheckSquare size={14} className="text-indigo-500" />
            {t('dashboard', 'todayWork', lang)}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: t('dashboard', 'inProgress', lang), value: workStats.active, icon: <ListTodo size={16}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: t('dashboard', 'overdue', lang), value: workStats.overdue, icon: <AlertTriangle size={16}/>, color: workStats.overdue > 0 ? 'text-red-600' : 'text-slate-400', bg: workStats.overdue > 0 ? 'bg-red-50' : 'bg-slate-50' },
              { label: t('dashboard', 'dueTodayKo', lang), value: workStats.dueToday, icon: <CheckSquare size={16}/>, color: workStats.dueToday > 0 ? 'text-orange-600' : 'text-slate-400', bg: workStats.dueToday > 0 ? 'bg-orange-50' : 'bg-slate-50' },
              { label: t('dashboard', 'keyTask', lang), value: workStats.keyTasks, icon: <Zap size={16}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((m, i) => (
              <Card key={i} className="p-4">
                <div className={'inline-flex p-1.5 rounded-lg mb-2 ' + m.bg}>
                  <span className={m.color}>{m.icon}</span>
                </div>
                <div className="text-2xl font-black text-slate-800">{m.value}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">{m.label}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('dashboard', 'totalDiagnoses', lang), value: lang === 'en' ? String(stats.diagnosisCount) : stats.diagnosisCount + t('dashboard', 'sessions', lang), icon: <Globe size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: t('dashboard', 'contentGenerated', lang), value: lang === 'en' ? String(stats.contentCount) : stats.contentCount + t('dashboard', 'sets', lang), icon: <FileText size={18} />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: t('dashboard', 'bestSeo', lang), value: lang === 'en' ? bestSeo + ' ' + t('dashboard', 'points', lang) : bestSeo + t('dashboard', 'points', lang), icon: <TrendingUp size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: t('dashboard', 'bestGeo', lang), value: lang === 'en' ? bestGeo + ' ' + t('dashboard', 'points', lang) : bestGeo + t('dashboard', 'points', lang), icon: <Zap size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((m, i) => (
          <Card key={i} className="p-5">
            <div className={'inline-flex p-2 rounded-xl mb-3 ' + m.bg}>
              <span className={m.color}>{m.icon}</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{m.value}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">{m.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 p-6">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            {t('dashboard', 'scoreTrend', lang)}
          </h4>
          {chartData.length > 1 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gPerf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gSeo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="performance" name="Performance" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#gPerf)" />
                  <Area type="monotone" dataKey="seo" name="SEO" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gSeo)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">
              {t('dashboard', 'needMoreData', lang)}
            </div>
          )}
        </Card>

        {/* Radar */}
        <Card className="p-6">
          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600" />
            {t('dashboard', 'recentDiagnosis', lang)}
          </h4>
          {latest && (
            <>
              <p className="text-xs text-slate-400 mb-4 truncate">{latest.url}</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {radarData.map((r) => (
                  <div key={r.subject} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-500 font-medium">{r.subject}</span>
                    <span className={'text-xs font-black ' + scoreColor(r.value)}>{r.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Recent diagnoses */}
      <Card className="p-6">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-indigo-600" />
          {t('dashboard', 'recentRecords', lang)}
        </h4>
        <div className="space-y-2">
          {diagnoses.slice(0, 8).map((d, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors">
              <Globe size={16} className="text-slate-400 shrink-0" />
              <span className="text-sm text-slate-700 font-medium flex-1 truncate">{d.url}</span>
              <div className="flex items-center gap-2 shrink-0">
                <ScoreBadge score={d.scores.performance} />
                <ScoreBadge score={d.scores.seo} />
                <ScoreBadge score={d.scores.geo} />
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(d.timestamp, lang)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
