import Link from 'next/link';
import SHOTS from '@/lib/sample-shots.json';

/**
 * 서비스 사이트 메인 — 데모 학원 화면 슬라이드 (F-01)
 * 화면 사진은 scripts/capture-samples.mjs 로 찍어 public/samples/ 에 둔다.
 * PC: 두 줄이 서로 반대로 천천히 흐르고, 마우스를 올리면 멈춘다.
 * 휴대폰·움직임 줄이기: 흐르지 않고 손가락으로 옆으로 넘긴다.
 */

type Shot = { id: string; demo: string; device: 'desktop' | 'mobile'; path: string; label: string };

const DEMO_META: Record<string, { badge: string; name: string; academy: string; color: string }> = {
  'demo-warm': { badge: '테마 A', name: '원장 직강형', academy: '따뜻한수학학원', color: '#1E5645' },
  'demo-result': { badge: '테마 B', name: '성과 중심형', academy: '결과수학학원', color: '#1D3FA8' },
  'demo-bright': { badge: '테마 C', name: '밝은 친근형', academy: '해피영어학원', color: '#0F766E' },
};

const shots = SHOTS as Shot[];
const half = Math.ceil(shots.length / 2);
const ROWS = [shots.slice(0, half), shots.slice(half)];

function Card({ s, hidden }: { s: Shot; hidden?: boolean }) {
  const m = DEMO_META[s.demo];
  const mobile = s.device === 'mobile';
  return (
    <Link
      href={s.path}
      target="_blank"
      rel="noopener noreferrer"
      className={`fd-sample-card${mobile ? ' is-m' : ''}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      aria-label={hidden ? undefined : `${m.academy} ${s.label} 데모 열기 (새 창)`}
    >
      <span className="fd-sample-shot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/samples/${s.id}.webp`} alt="" width={mobile ? 360 : 960} height={mobile ? 720 : 600} loading="lazy" decoding="async" />
      </span>
      <span className="fd-sample-cap">
        <span className="fd-sample-badge" style={{ background: m.color }}>{m.badge}</span>
        <span className="fd-sample-label">{mobile ? s.label : `${m.name} · ${s.label}`}</span>
      </span>
    </Link>
  );
}

export function SampleSlider() {
  return (
    <section style={{ padding: 'clamp(56px, 7vw, 96px) 0', background: '#14213D', color: '#FFFFFF', overflow: 'hidden' }} aria-labelledby="fd-samples-h">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px, 4vw, 56px)', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 36 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F5B700' }}>샘플 화면</div>
          <h2 id="fd-samples-h" style={{ margin: 0, fontSize: 'clamp(28px, 3.2vw, 42px)', lineHeight: 1.35, letterSpacing: '-0.8px' }}>더클로 만든 학원 홈페이지</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: '#B8C0CF' }}>학부모가 보는 홈페이지와 원장님이 쓰는 관리 화면입니다. 눌러서 데모를 직접 둘러보세요.</p>
        </div>
        <Link href="/demo" style={{ height: 48, padding: '0 22px', borderRadius: 10, background: '#F5B700', color: '#14213D', textDecoration: 'none', fontSize: 15, fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>데모 전체 보기 →</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {ROWS.map((row, i) => (
          <div key={i} className="fd-sample-row">
            <div className={`fd-sample-track${i % 2 ? ' is-rev' : ''}`}>
              {row.map((s) => <Card key={s.id} s={s} />)}
              {row.map((s) => <Card key={`${s.id}-dup`} s={s} hidden />)}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .fd-sample-row { overflow: hidden; }
        .fd-sample-track { display: flex; gap: 20px; width: max-content; padding: 4px 10px 8px; animation: fd-sample-flow 70s linear infinite; }
        .fd-sample-track.is-rev { animation-direction: reverse; }
        .fd-sample-row:hover .fd-sample-track, .fd-sample-row:focus-within .fd-sample-track { animation-play-state: paused; }
        @keyframes fd-sample-flow { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .fd-sample-card { display: flex; flex-direction: column; gap: 10px; text-decoration: none; color: #FFFFFF; flex-shrink: 0; }
        .fd-sample-shot { display: block; width: 432px; height: 270px; border-radius: 14px; overflow: hidden; background: #FFFFFF; border: 1px solid #2A3A5C; box-shadow: 0 8px 24px rgba(0,0,0,0.25); transition: transform .2s, box-shadow .2s; }
        .fd-sample-card.is-m .fd-sample-shot { width: 135px; border-radius: 18px; border: 3px solid #0A1226; }
        .fd-sample-shot img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; }
        .fd-sample-card:hover .fd-sample-shot { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(0,0,0,0.35); }
        .fd-sample-cap { display: flex; align-items: center; gap: 8px; font-size: 14px; max-width: 432px; }
        .fd-sample-card.is-m .fd-sample-cap { max-width: 135px; flex-direction: column; align-items: flex-start; gap: 4px; font-size: 13px; }
        .fd-sample-badge { padding: 2px 8px; border-radius: 6px; color: #FFFFFF; font-size: 12px; font-weight: 700; flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25); }
        .fd-sample-label { font-weight: 600; color: #D5DBE6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        @media (max-width: 760px) {
          .fd-sample-row { overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .fd-sample-row::-webkit-scrollbar { display: none; }
          .fd-sample-track { animation: none; gap: 14px; padding: 4px 16px 8px; }
          .fd-sample-track > [aria-hidden="true"] { display: none; }
          .fd-sample-card { scroll-snap-align: start; }
          .fd-sample-shot { width: 288px; height: 180px; }
          .fd-sample-card.is-m .fd-sample-shot { width: 90px; }
          .fd-sample-cap { max-width: 288px; font-size: 13px; }
          .fd-sample-card.is-m .fd-sample-cap { max-width: 90px; font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fd-sample-row { overflow-x: auto; }
          .fd-sample-track { animation: none; }
          .fd-sample-track > [aria-hidden="true"] { display: none; }
        }
      `}</style>
    </section>
  );
}
