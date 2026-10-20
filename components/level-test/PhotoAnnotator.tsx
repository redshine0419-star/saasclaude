'use client';

import { useEffect, useRef, useState } from 'react';
import { MARK_COLORS, strokePath, type Stroke } from '@/lib/level-test/marks';

/** 풀이 사진 위에 손가락·펜·마우스로 표시. 좌표는 사진 기준 0~1로 저장한다. */
export function PhotoAnnotator({ src, initial, onSave, onClose }: { src: string; initial: Stroke[]; onSave: (s: Stroke[]) => void; onClose: () => void }) {
  const [strokes, setStrokes] = useState<Stroke[]>(initial);
  const [color, setColor] = useState(MARK_COLORS[0]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function point(e: React.PointerEvent): [number, number] {
    const r = box.current!.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
  }

  const btn: React.CSSProperties = { height: 40, padding: '0 14px', borderRadius: 8, border: '1px solid #3E4652', background: '#2C3747', color: '#FFFFFF', font: 'inherit', fontSize: 14, cursor: 'pointer' };
  const all = current ? [...strokes, current] : strokes;

  return (
    <div role="dialog" aria-label="풀이 사진에 표시하기" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,20,28,0.92)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: 10, alignItems: 'center', flexWrap: 'wrap', color: '#FFFFFF' }}>
        {MARK_COLORS.map((c) => (
          <button key={c} type="button" aria-label="펜 색" aria-pressed={c === color} onClick={() => setColor(c)} style={{ width: 32, height: 32, borderRadius: 16, background: c, border: c === color ? '3px solid #FFFFFF' : '1px solid #3E4652', cursor: 'pointer' }} />
        ))}
        <button type="button" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length} style={btn}>되돌리기</button>
        <button type="button" onClick={() => setStrokes([])} disabled={!strokes.length} style={btn}>모두 지우기</button>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={onClose} style={btn}>취소</button>
        <button type="button" onClick={() => onSave(strokes)} style={{ ...btn, background: '#1E5645', border: 'none', fontWeight: 700 }}>표시 저장</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 10 }}>
        <div
          ref={box}
          style={{ position: 'relative', lineHeight: 0, maxWidth: 'min(100%, 1000px)', touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            setCurrent({ color, points: [point(e)] });
          }}
          onPointerMove={(e) => {
            if (!current) return;
            const p = point(e);
            const last = current.points[current.points.length - 1];
            if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 0.002) return;
            setCurrent({ ...current, points: [...current.points, p] });
          }}
          onPointerUp={() => {
            if (current) setStrokes((s) => [...s, current]);
            setCurrent(null);
          }}
          onPointerCancel={() => setCurrent(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="채점할 풀이 사진" draggable={false} style={{ display: 'block', width: '100%', height: 'auto', userSelect: 'none', borderRadius: 6 }} />
          <svg viewBox="0 0 1 1" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {all.map((s, i) => (
              <path key={i} d={strokePath(s.points)} fill="none" stroke={s.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
