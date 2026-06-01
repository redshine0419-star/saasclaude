'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Play, Star, Clock } from 'lucide-react';

const movies = [
  {
    id: 'les-mis',
    title: '레 미제라블',
    year: 2012,
    type: 'Movie',
    director: '톰 후퍼',
    desc: '프랑스 혁명 이후 격동의 시대를 배경으로 장발장의 구원과 용서, 1832년 6월 항쟁을 담은 뮤지컬 대서사시. 세능검 19세기 프랑스 파트 단골 배경.',
    youtubeId: 'tgbNymZ7vqY',
    tags: ['프랑스 혁명', '19세기', '민중봉기'],
    matchRate: '92%',
    rating: 4.8,
    runtime: '158분',
    color: '#5b8dd9',
  },
  {
    id: 'napoleon',
    title: '나폴레옹',
    year: 2023,
    type: 'Movie',
    director: '리들리 스콧',
    desc: '리들리 스콧 감독의 2023년 대작. 나폴레옹의 전쟁 전략부터 워털루 패배까지. 세능검 나폴레옹 전쟁 파트 필수 시청. 호아킨 피닉스 주연.',
    youtubeId: 'OAZWXUkrjPc',
    tags: ['나폴레옹', '워털루', '제국'],
    matchRate: '98%',
    rating: 4.1,
    runtime: '158분',
    color: '#c0392b',
  },
  {
    id: 'marie',
    title: '마리 앙투아네트',
    year: 2006,
    type: 'Movie',
    director: '소피아 코폴라',
    desc: '소피아 코폴라 감독의 감각적 해석. 14세 소녀의 눈으로 바라본 베르사유 궁전의 화려함과 고독. 역사적 고증보다 감성에 집중한 아트 영화.',
    youtubeId: 'AkR0MmJhC2o',
    tags: ['마리 앙투아네트', '베르사유', '왕실'],
    matchRate: '87%',
    rating: 3.9,
    runtime: '123분',
    color: '#d4a843',
  },
  {
    id: 'danton',
    title: '당통',
    year: 1982,
    type: 'Movie',
    director: '안제이 바이다',
    desc: '공포정치 시기 로베스피에르와 당통의 대립. 폴란드 거장 안제이 바이다 감독의 명작. 세능검 공화정 파트 심화 학습에 추천.',
    youtubeId: 'l482T0yNkeo',
    tags: ['공포정치', '로베스피에르', '공화정'],
    matchRate: '95%',
    rating: 4.5,
    runtime: '136분',
    color: '#4a7c59',
  },
];

export default function MediaPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const current = movies.find((m) => m.id === selected);

  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <Navigation />

      <main className="pt-20 pb-24 md:pb-8 max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold-dark)' }}>
            🎬 역사 미디어
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: 'var(--cream)', fontFamily: 'Georgia, serif' }}>
            역사 영화 큐레이션
          </h1>
          <p className="text-sm" style={{ color: 'var(--cream-muted)' }}>
            세능검 출제 배경과 연계된 필수 역사 영화 · 예고편 바로 감상
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Movie list */}
          <div className="lg:col-span-1 space-y-3">
            {movies.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className="w-full p-4 rounded-xl border text-left transition-all"
                style={{
                  backgroundColor: selected === m.id ? `${m.color}18` : 'var(--surface)',
                  borderColor: selected === m.id ? m.color : 'var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--cream)' }}>{m.title}</p>
                    <p className="text-xs" style={{ color: 'var(--cream-muted)' }}>{m.year} · {m.director}</p>
                  </div>
                  <div
                    className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ backgroundColor: `${m.color}22`, color: m.color }}
                  >
                    {m.matchRate}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--cream-muted)' }}>
                  <span className="flex items-center gap-0.5"><Star size={10} />{m.rating}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Clock size={10} />{m.runtime}</span>
                  {selected === m.id && <span className="flex items-center gap-0.5 ml-auto" style={{ color: m.color }}><Play size={10} />재생 중</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Player area */}
          <div className="lg:col-span-2">
            {current ? (
              <div className="fade-in-up">
                {/* YouTube embed */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${current.color}44` }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${current.youtubeId}?autoplay=0&rel=0`}
                    title={current.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>

                {/* Movie info */}
                <div className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: 'var(--cream)' }}>{current.title} ({current.year})</h2>
                      <p className="text-xs" style={{ color: 'var(--cream-muted)' }}>감독: {current.director} · {current.runtime}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs mb-0.5" style={{ color: 'var(--cream-muted)' }}>시험 연계</p>
                      <p className="text-xl font-black" style={{ color: current.color }}>{current.matchRate}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--cream-muted)' }}>{current.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {current.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{ backgroundColor: `${current.color}18`, color: current.color }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="aspect-video w-full rounded-2xl flex flex-col items-center justify-center border"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="text-5xl mb-3">🎬</div>
                <p className="text-sm font-medium" style={{ color: 'var(--cream-muted)' }}>왼쪽에서 영화를 선택하세요</p>
                <p className="text-xs mt-1" style={{ color: 'var(--cream-muted)', opacity: 0.6 }}>예고편이 여기서 재생됩니다</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
