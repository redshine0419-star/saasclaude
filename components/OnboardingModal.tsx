'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Megaphone, X, ChevronRight, Zap } from 'lucide-react';

const STEPS = [
  {
    icon: <Search size={28} />,
    badge: '01',
    title: 'GEO & SEO 엔진 진단',
    description: 'URL 하나만 입력하면 AI가 PageSpeed, GEO 가시성, 기술 SEO를 즉시 분석합니다. ChatGPT·Claude 같은 AI 검색엔진의 크롤링 가능성까지 점검합니다.',
    highlight: '→ Engine Diagnosis 탭에서 시작',
  },
  {
    icon: <FileText size={28} />,
    badge: '02',
    title: 'AI 키워드 & 콘텐츠 자동화',
    description: '키워드 하나로 검색 의도·경쟁도·롱테일을 분석하고, 4개 채널(블로그·SNS·뉴스레터·광고) 마케팅 소재를 한 번에 자동 생성합니다.',
    highlight: '→ Keyword Analysis & Content Orchestrator 탭',
  },
  {
    icon: <Megaphone size={28} />,
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
      <div className="absolute inset-0 bg-black/80" onClick={finish} />
      <div className="relative bg-white dark:bg-[#0d1117] rounded-lg w-full max-w-md overflow-hidden border border-[#eaeef2] dark:border-[#30363d] shadow-lg">

        {/* Top black accent bar */}
        <div className="h-[3px] bg-[#000000] dark:bg-[#ffffff]" />

        <div className="p-8">
          {/* Close */}
          <button
            onClick={finish}
            className="absolute top-5 right-4 p-1.5 text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] rounded-md transition-colors"
          >
            <X size={16} />
          </button>

          {/* Progress dots */}
          <div className="flex gap-2 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 rounded-full flex-1 transition-all duration-300 ${
                  i <= step
                    ? 'bg-[#000000] dark:bg-[#ffffff]'
                    : 'bg-[#eaeef2] dark:bg-[#30363d]'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-14 h-14 rounded-md bg-[#f6f8fa] dark:bg-[#161b22] border border-[#eaeef2] dark:border-[#30363d] flex items-center justify-center text-[#24292f] dark:text-[#e6edf3]">
              {current.icon}
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#57606a] dark:text-[#8b949e] uppercase tracking-[3px] font-mono">
                STEP {current.badge}
              </span>
              <h2 className="text-xl font-bold text-[#24292f] dark:text-[#e6edf3] mt-1">
                {current.title}
              </h2>
            </div>
            <p className="text-sm text-[#57606a] dark:text-[#8b949e] leading-relaxed">
              {current.description}
            </p>
            <div className="px-4 py-2 bg-[#f6f8fa] dark:bg-[#161b22] border border-[#eaeef2] dark:border-[#30363d] rounded-md w-full text-left">
              <p className="text-xs font-mono text-[#57606a] dark:text-[#8b949e]">
                {current.highlight}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-2.5 border border-[#eaeef2] dark:border-[#30363d] rounded-md text-sm font-medium text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep(s => s + 1))}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#000000] dark:bg-[#ffffff] hover:bg-[#333333] dark:hover:bg-[#e6edf3] text-white dark:text-[#000000] rounded-md text-sm font-medium transition-colors"
            >
              {isLast ? (
                <><Zap size={14} fill="currentColor" /> 시작하기</>
              ) : (
                <>다음 <ChevronRight size={14} /></>
              )}
            </button>
          </div>

          <button
            onClick={finish}
            className="w-full mt-3 text-center text-xs text-[#57606a] dark:text-[#8b949e] hover:text-[#24292f] dark:hover:text-[#e6edf3] transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}
