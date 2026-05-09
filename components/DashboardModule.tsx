'use client';

import { BarChart3, TrendingUp, Zap, MousePointer2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">{children}</span>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const MOCK_CHART_DATA = [
  { day: 'Mon', roas: 4.2 }, { day: 'Tue', roas: 4.5 }, { day: 'Wed', roas: 3.8 },
  { day: 'Thu', roas: 5.1 }, { day: 'Fri', roas: 4.9 }, { day: 'Sat', roas: 5.5 }, { day: 'Sun', roas: 4.3 },
];

export default function DashboardModule() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="p-5 md:p-6 border-rose-100 bg-rose-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <div className="p-3 bg-rose-500 text-white rounded-2xl animate-bounce"><AlertTriangle size={24} /></div>
          <div>
            <h4 className="font-bold text-rose-900 text-sm mb-0.5 uppercase tracking-wide">이상 징후 리포트</h4>
            <p className="text-rose-700 text-sm leading-relaxed">최근 3시간 내 <strong className="text-rose-900">결제 완료 단계</strong>의 이탈률이 15% 증가했습니다.</p>
          </div>
        </div>
        <button className="whitespace-nowrap px-6 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all">로그 데이터 즉시 확인</button>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Users', value: '12,840', change: '+12%', positive: true },
          { label: 'Avg ROAS', value: '5.2x', change: '+0.4x', positive: true },
          { label: 'Conversion Rate', value: '3.1%', change: '-0.2%', positive: false },
          { label: 'Ad Spend', value: '₩15.2M', change: '+5.4%', positive: true },
        ].map((m, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between h-32">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black text-slate-800">{m.value}</span>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${m.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{m.change}</span>
            </div>
            <div className="h-1 w-full bg-indigo-500/10 mt-3 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-2/3" /></div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-bold text-slate-800 flex items-center gap-2"><BarChart3 size={20} className="text-indigo-600" />퍼포먼스 성과 매트릭스</h4>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-[10px] font-bold bg-slate-900 text-white rounded-lg">Realtime</button>
              <button className="px-3 py-1 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200">Historical</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_CHART_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '12px' }} />
                <Area type="monotone" dataKey="roas" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 md:p-8 flex flex-col">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-600" />AI 시니어 마케터 제언</h4>
          <div className="flex-1 space-y-4">
            {[
              { icon: <Zap size={16} />, text: 'GFA 타겟팅 범위를 25-34에서 20-39로 소폭 확장 권장', tag: 'Traffic' },
              { icon: <MousePointer2 size={16} />, text: '상세 페이지 스크롤 50% 지점 이탈 급증. UI 개선 필요', tag: 'UX/UI' },
              { icon: <ShieldCheck size={16} />, text: '주요 키워드 "AI 에이전트" 검색 광고 순위 하락 방어 필요', tag: 'Ads' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group cursor-pointer border border-transparent hover:border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm">{item.icon}</div>
                  <Badge>{item.tag}</Badge>
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed group-hover:text-indigo-700">{item.text}</p>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-slate-200">액션 아이템 일괄 처리하기</button>
        </Card>
      </div>
    </div>
  );
}