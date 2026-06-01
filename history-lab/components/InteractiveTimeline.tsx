'use client';

import { useState } from 'react';

const events = [
  {
    year: '1789.5',
    title: '삼부회 소집',
    desc: '루이 16세가 재정 위기를 타개하려 삼부회를 소집. 제3신분(평민)이 의석 수에 불만을 품고 독자 행동에 나선다.',
    emoji: '🏛️',
    color: '#4a7c59',
  },
  {
    year: '1789.6',
    title: '국민의회 선언',
    desc: '제3신분 대표들이 테니스코트에서 헌법 제정을 맹세. 절대왕정에 맞선 최초의 공식 저항.',
    emoji: '✊',
    color: '#d4a843',
  },
  {
    year: '1789.7',
    title: '바스티유 함락',
    desc: '민중이 정치범 수용소 바스티유를 습격. 실제 수감자는 7명뿐이었지만 혁명의 상징이 되었다.',
    emoji: '🔥',
    color: '#c0392b',
  },
  {
    year: '1789.8',
    title: '봉건제 폐지',
    desc: '귀족들이 자발적으로 특권을 포기. 프랑스 인권선언 발표 — "인간은 태어나면서부터 자유롭고 평등하다"',
    emoji: '📜',
    color: '#5b8dd9',
  },
  {
    year: '1792',
    title: '왕권 정지 & 공화정 선포',
    desc: '오스트리아-프로이센 연합군 침공. 민중이 튈르리 궁을 습격하고 루이 16세는 체포된다.',
    emoji: '👑',
    color: '#8b4a8b',
  },
  {
    year: '1793',
    title: '루이 16세 처형',
    desc: '단두대에서 처형. 마리 앙투아네트도 같은 해 10월 처형된다. 공포정치의 서막.',
    emoji: '⚔️',
    color: '#c0392b',
  },
  {
    year: '1799',
    title: '나폴레옹 쿠데타',
    desc: '브뤼메르 18일 쿠데타. 나폴레옹이 무력으로 총재정부를 전복하고 제1통령이 된다. 혁명의 종막.',
    emoji: '🎖️',
    color: '#d4a843',
  },
];

export default function InteractiveTimeline() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative py-4">
      {/* Desktop: horizontal scroll timeline */}
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="flex gap-0 min-w-max px-4">
          {events.map((ev, i) => (
            <div key={i} className="flex flex-col items-center" style={{ width: '140px' }}>
              {/* Card (top/bottom alternating) */}
              {i % 2 === 0 ? (
                <>
                  <button
                    onClick={() => setActive(active === i ? null : i)}
                    className="mb-2 p-3 rounded-xl border text-center transition-all w-28"
                    style={{
                      backgroundColor: active === i ? `${ev.color}22` : 'var(--surface)',
                      borderColor: active === i ? ev.color : 'var(--border)',
                    }}
                  >
                    <div className="text-xl mb-1">{ev.emoji}</div>
                    <div className="text-[10px] font-bold" style={{ color: ev.color }}>{ev.year}</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--cream)' }}>{ev.title}</div>
                  </button>
                  {/* connector */}
                  <div className="w-px h-6" style={{ backgroundColor: 'var(--border)' }} />
                  <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: ev.color, borderColor: ev.color }} />
                  <div className="w-px h-6" style={{ backgroundColor: 'var(--border)' }} />
                  <div className="w-28 h-16" />
                </>
              ) : (
                <>
                  <div className="w-28 h-16" />
                  <div className="w-px h-6" style={{ backgroundColor: 'var(--border)' }} />
                  <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: ev.color, borderColor: ev.color }} />
                  <div className="w-px h-6" style={{ backgroundColor: 'var(--border)' }} />
                  <button
                    onClick={() => setActive(active === i ? null : i)}
                    className="mt-2 p-3 rounded-xl border text-center transition-all w-28"
                    style={{
                      backgroundColor: active === i ? `${ev.color}22` : 'var(--surface)',
                      borderColor: active === i ? ev.color : 'var(--border)',
                    }}
                  >
                    <div className="text-xl mb-1">{ev.emoji}</div>
                    <div className="text-[10px] font-bold" style={{ color: ev.color }}>{ev.year}</div>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--cream)' }}>{ev.title}</div>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical timeline */}
      <div className="md:hidden space-y-0">
        {events.map((ev, i) => (
          <div key={i} className="flex gap-4">
            {/* Left line + dot */}
            <div className="flex flex-col items-center">
              <div className="w-px flex-1" style={{ backgroundColor: i === 0 ? 'transparent' : 'var(--border)', minHeight: '16px' }} />
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
              <div className="w-px flex-1" style={{ backgroundColor: i === events.length - 1 ? 'transparent' : 'var(--border)', minHeight: '16px' }} />
            </div>
            {/* Content */}
            <button
              onClick={() => setActive(active === i ? null : i)}
              className="flex-1 mb-3 p-3 rounded-xl border text-left transition-all"
              style={{
                backgroundColor: active === i ? `${ev.color}18` : 'var(--surface)',
                borderColor: active === i ? ev.color : 'var(--border)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{ev.emoji}</span>
                <span className="text-[11px] font-bold" style={{ color: ev.color }}>{ev.year}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--cream)' }}>{ev.title}</span>
              </div>
              {active === i && (
                <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--cream-muted)' }}>{ev.desc}</p>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Desktop detail panel */}
      {active !== null && (
        <div className="hidden md:block mt-4 p-4 rounded-xl border fade-in-up" style={{ backgroundColor: `${events[active].color}15`, borderColor: events[active].color }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--cream)' }}>{events[active].desc}</p>
        </div>
      )}
    </div>
  );
}
