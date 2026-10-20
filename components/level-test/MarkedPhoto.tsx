import { strokePath, type Stroke } from '@/lib/level-test/marks';

/** 풀이 사진 위에 선생님 펜 표시를 SVG로 겹쳐 보여준다 */
export function MarkedPhoto({ src, strokes, alt, style }: { src: string; strokes: Stroke[]; alt: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 8 }} />
      {strokes.length > 0 && (
        <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {strokes.map((s, i) => (
            <path key={i} d={strokePath(s.points)} fill="none" stroke={s.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      )}
    </div>
  );
}
