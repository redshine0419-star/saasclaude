'use client';

import { useEffect, useRef, useState } from 'react';

export type ChartScore = { id: string; examDate: string; label: string; subject: string; score: number; maxScore: number };

// 과목 색은 과목 이름 정렬 순서로 고정 배정(필터로 과목 수가 바뀌어도 색이 바뀌지 않게). 8개를 넘으면 회색 "기타"
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const OTHER = '#9AA3AF';

const H = 220;
const PAD = { top: 12, right: 16, bottom: 28, left: 36 };

export function subjectColors(subjects: string[]): Map<string, string> {
  const sorted = [...new Set(subjects)].sort((a, b) => a.localeCompare(b, 'ko'));
  return new Map(sorted.map((s, i) => [s, SERIES[i] ?? OTHER]));
}

/** 과목별 득점률(%) 추이. 점수 표가 아래에 있어 표 보기를 겸한다 */
export function ScoreChart({ scores, colors }: { scores: ChartScore[]; colors: Map<string, string> }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (scores.length === 0) return null;

  const times = scores.map((s) => Date.parse(s.examDate));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (d: string) => PAD.left + (t1 === t0 ? innerW / 2 : ((Date.parse(d) - t0) / (t1 - t0)) * innerW);
  const y = (pct: number) => PAD.top + (1 - pct / 100) * innerH;
  const pct = (s: ChartScore) => (s.score / s.maxScore) * 100;

  const bySubject = new Map<string, ChartScore[]>();
  for (const s of scores) bySubject.set(s.subject, [...(bySubject.get(s.subject) ?? []), s]);
  const subjects = [...bySubject.keys()].sort((a, b) => a.localeCompare(b, 'ko'));
  const hovered = scores.find((s) => s.id === hover) ?? null;

  // x축 눈금: 처음·끝(+가운데) 날짜만
  const ticks = t1 === t0 ? [scores[0].examDate] : [scores[0].examDate, ...(innerW > 360 ? [new Date((t0 + t1) / 2).toISOString().slice(0, 10)] : []), new Date(t1).toISOString().slice(0, 10)];

  return (
    <div ref={wrap} style={{ position: 'relative', width: '100%' }}>
      {subjects.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 8, fontSize: 13, color: '#3E4652' }}>
          {subjects.map((s) => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 3, borderRadius: 2, background: colors.get(s) ?? OTHER }} />{s}
            </span>
          ))}
        </div>
      )}
      <svg width={w} height={H} role="img" aria-label="과목별 득점률 추이" style={{ display: 'block' }} onMouseLeave={() => setHover(null)}>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={PAD.left} x2={w - PAD.right} y1={y(g)} y2={y(g)} stroke="#EEEAE2" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(g) + 4} textAnchor="end" fontSize={11} fill="#5A6270">{g}%</text>
          </g>
        ))}
        {ticks.map((d, i) => (
          <text key={d + i} x={x(d)} y={H - 8} textAnchor={i === 0 && ticks.length > 1 ? 'start' : i === ticks.length - 1 && ticks.length > 1 ? 'end' : 'middle'} fontSize={11} fill="#5A6270">{d.slice(2).replace(/-/g, '.')}</text>
        ))}
        {subjects.map((s) => {
          const pts = bySubject.get(s)!;
          const color = colors.get(s) ?? OTHER;
          return (
            <g key={s}>
              {pts.length > 1 && <polyline points={pts.map((p) => `${x(p.examDate)},${y(pct(p))}`).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
              {pts.map((p) => (
                <g key={p.id}>
                  <circle cx={x(p.examDate)} cy={y(pct(p))} r={hover === p.id ? 6 : 4} fill={color} stroke="#FFFFFF" strokeWidth={2} />
                  {/* 마커보다 넓은 터치 영역 */}
                  <circle cx={x(p.examDate)} cy={y(pct(p))} r={14} fill="transparent" onMouseEnter={() => setHover(p.id)} onClick={() => setHover(p.id)} style={{ cursor: 'pointer' }} />
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div style={{ position: 'absolute', left: Math.min(Math.max(x(hovered.examDate) - 80, 0), w - 170), top: Math.max(y(pct(hovered)) - 70, 0) + (subjects.length > 1 ? 28 : 0), width: 160, padding: '8px 10px', borderRadius: 8, background: '#1B2430', color: '#FFFFFF', fontSize: 12, lineHeight: 1.5, pointerEvents: 'none' }}>
          <div style={{ fontWeight: 700 }}>{hovered.subject} · {Math.round(pct(hovered))}%</div>
          <div>{hovered.label}</div>
          <div style={{ color: '#C8CDD5' }}>{hovered.examDate.replace(/-/g, '.')} · {hovered.score}/{hovered.maxScore}</div>
        </div>
      )}
    </div>
  );
}
