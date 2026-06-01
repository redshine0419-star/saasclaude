'use client';

import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdInterstitialModal({ isOpen, onClose }: Props) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const canClose = countdown === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,7,3,0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--gold-dark)' }}>
            Sponsored
          </span>
          <button
            onClick={canClose ? onClose : undefined}
            className="text-xs px-2 py-1 rounded transition-all"
            style={{
              color: canClose ? 'var(--cream-muted)' : 'transparent',
              cursor: canClose ? 'pointer' : 'default',
              backgroundColor: canClose ? 'rgba(255,255,255,0.05)' : 'transparent',
            }}
          >
            ✕
          </button>
        </div>

        {/* Ad Content */}
        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--gold)' }}>
            🏆 세계사 능력 검정 1급
          </p>
          <h3 className="text-lg font-bold mb-3 leading-snug" style={{ color: 'var(--cream)' }}>
            초고속 패스 교재 패키지<br />
            <span style={{ color: 'var(--gold)' }}>0원 무료 배포</span> 중
          </h3>

          {/* Fake ad creative */}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="block w-full rounded-xl p-4 text-center transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f, #2d1f0e)',
              border: '1px solid rgba(212,168,67,0.3)',
              opacity: canClose ? 1 : 0.85,
            }}
          >
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--gold)' }}>에듀윌 세능검</p>
            <p className="text-xs mb-3" style={{ color: 'var(--cream-muted)' }}>
              합격자 95% 선택 · 2025 최신 개정판
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--gold)', color: '#1a1208' }}>
              무료 교재 받기 <ExternalLink size={11} />
            </span>
          </a>

          {/* Countdown / CTA */}
          <div className="mt-4 flex items-center justify-between">
            {!canClose ? (
              <>
                <span className="text-xs" style={{ color: 'var(--cream-muted)' }}>
                  결과까지
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="13" fill="none" stroke="var(--border)" strokeWidth="3" />
                      <circle
                        cx="16" cy="16" r="13"
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth="3"
                        strokeDasharray="81.7"
                        strokeDashoffset={81.7 * (1 - countdown / 5)}
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--gold)' }}>
                      {countdown}
                    </span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>초</span>
                </div>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 pulse-gold"
                style={{ backgroundColor: 'var(--gold)', color: '#1a1208' }}
              >
                🎯 지금 결과 확인하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
