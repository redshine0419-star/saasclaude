'use client';

import { useState } from 'react';
import {
  LayoutDashboard, Search, FileText, Zap, ChevronRight, Bell, User, CheckCircle2,
} from 'lucide-react';
import DiagnosisModule from '@/components/DiagnosisModule';
import ContentHubModule from '@/components/ContentHubModule';
import DashboardModule from '@/components/DashboardModule';

const TABS = { DIAGNOSIS: 'diagnosis', CONTENT: 'content', DASHBOARD: 'dashboard' } as const;
type Tab = typeof TABS[keyof typeof TABS];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(TABS.DIAGNOSIS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const menuItems = [
    { id: TABS.DIAGNOSIS, icon: <Search size={20} />, label: 'Engine Diagnosis', mobileLabel: '진단' },
    { id: TABS.CONTENT, icon: <FileText size={20} />, label: 'Content Orchestrator', mobileLabel: '콘텐츠' },
    { id: TABS.DASHBOARD, icon: <LayoutDashboard size={20} />, label: 'Ops Dashboard', mobileLabel: '대시보드' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden select-none">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col z-20">
        <div className="p-8">
          <div className="flex items-center gap-2.5 text-indigo-600 font-black text-2xl tracking-tighter">
            <Zap size={32} fill="currentColor" strokeWidth={2.5} />
            <span>MarketerOps<span className="text-slate-400 font-light">.ai</span></span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-1'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className={activeTab === item.id ? 'text-white' : 'group-hover:text-indigo-500'}>{item.icon}</span>
              <span className="font-bold text-sm">{item.label}</span>
              {activeTab === item.id && <ChevronRight className="ml-auto opacity-50" size={16} />}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[2px]">Enterprise Tier</span>
              </div>
              <p className="text-sm font-bold mb-1">Senior Marketer Mode</p>
              <p className="text-[10px] text-slate-300">10년차 이상의 직관을 AI가 보조합니다.</p>
            </div>
            <Zap className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-10 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden p-2 bg-indigo-600 text-white rounded-xl">
              <Zap size={20} fill="currentColor" />
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors group">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
            </button>
            <div className="h-10 w-10 md:h-11 md:w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 cursor-pointer hover:bg-indigo-100 transition-colors">
              <User size={22} strokeWidth={2.5} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 scroll-smooth">
          {activeTab === TABS.DIAGNOSIS && <DiagnosisModule onToast={showToast} />}
          {activeTab === TABS.CONTENT && <ContentHubModule onToast={showToast} />}
          {activeTab === TABS.DASHBOARD && <DashboardModule />}
        </div>

        {/* Bottom Nav (Mobile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-lg border-t border-slate-200 flex items-center justify-around px-4 z-30">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-xl transition-colors ${activeTab === item.id ? 'bg-indigo-50' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.mobileLabel}</span>
            </button>
          ))}
        </nav>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-bold tracking-tight">{toast}</span>
          </div>
        </div>
      )}

      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
