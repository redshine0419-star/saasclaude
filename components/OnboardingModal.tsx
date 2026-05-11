'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Megaphone, X, ChevronRight, Zap } from 'lucide-react';

const STEPS = [
  {
    icon: <Search size={36} className="text-indigo-500" />,
    badge: '01',
    title: 'GEO & SEO 엔진 진단',
    description: 'URL 하나만 입력하면 AI가 PageSpeed, GEO 가시성, 기술 SEO를 즉시 분석합니다. ChatGPT·Claude 같은 AI 검색엔진의 크롤링 가능성까지 점검합니다.',
    highlight: '→ Engine Diagnosis 탭에서 시작',
  },
  {
    icon: <FileText size={36} className="text-indigo-500" />,
    badge: '02',
    title: 'AI 키워드 & 콘텐츠 자동화',
    description: '키워드 하나로 검색 의도·경쟁도·롱테일을 분석하고, 4개 채널(블로그·SNS·뉴스레터·광고) 마케팅 소재를 한 번에 자동 생성합니다.',
    highlight: '→ Keyword Analysis & Content Orchestrator 탭',
  },
  {
    icon: <Megaphone size={36} className="text-indigo-500" />,
    badge: '03',
    title: 'AI 언급율 (Share of Voice)',
    description: 'ChatGPT·Gemini가 고객 프롬프트에 답할 때 우리 브랜드를 얼마나 언급하는지 측정합니다. 경쟁사 대비 AI 점유율을 파악하고 전략을 수립하세요.',
    highlight: '→ AI Share of Voice 탭에서 확인',
  },
];

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem('marketerops_onboarded') !== 'true') {
      setShow(true);
    }
  }, []);

  const finish = () => {
    localStorage.setItem('marketerops_onboarded', 'true');
    setShow(false);
  };

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={finish} />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-8">
          <button
            onClick={finish}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  i <= step ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              {current.icon}
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[3px]">
                STEP {current.badge}
              </span>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {current.title}
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {current.description}
            </p>
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                {current.highlight}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep(s => s + 1))}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-200"
            >
              {isLast ? (
                <><Zap size={15} fill="currentColor" /> 시작하기</>
              ) : (
                <>다음 <ChevronRight size={15} /></>
              )}
            </button>
          </div>

          <button
            onClick={finish}
            className="w-full mt-3 text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}
