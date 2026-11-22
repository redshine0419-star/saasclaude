'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * 관리자 앱(홈 화면) 설치 안내.
 * 열리는 때: (1) 홈페이지를 막 만든 뒤(?welcome=1) (2) 시작 체크리스트에서 누를 때(?install=1)
 *           (3) 설치하지 않은 원장이 휴대폰으로 세 번째 들어왔을 때 한 번.
 * 이미 앱으로 열었거나 설치한 기기, '나중에'를 누른 기기(1·3번)에는 다시 뜨지 않는다. 기록은 이 기기의 브라우저에만 둔다.
 */

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Env = 'android' | 'ios' | 'inapp' | 'desktop';
type Step = 'install' | 'notify';

const REVISIT_AT = 3;
const key = (slug: string, k: string) => `adm-install:${slug}:${k}`;
function get(k: string): string | null {
  try { return window.localStorage.getItem(k); } catch { return null; }
}
function set(k: string, v: string) {
  try { window.localStorage.setItem(k, v); } catch { /* 저장 못 해도 안내는 동작 */ }
}

function detectEnv(): Env {
  const ua = navigator.userAgent;
  if (/KAKAOTALK|NAVER\(inapp|; wv\)|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i.test(ua)) return 'inapp';
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

const BTN: React.CSSProperties = { height: 48, padding: '0 18px', borderRadius: 10, border: 'none', background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%' };
const GHOST: React.CSSProperties = { ...BTN, background: '#FFFFFF', color: '#5A6270', border: '1px solid #D5D0C6', fontWeight: 500, fontSize: 15 };

export function InstallSheet({ slug, appName, qrSvg, installUrl }: { slug: string; appName: string; qrSvg: string; installUrl: string }) {
  const [open, setOpen] = useState(false);
  const [env, setEnv] = useState<Env>('desktop');
  const [step, setStep] = useState<Step>('install');
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const onInstalled = () => { set(key(slug, 'state'), 'installed'); setStep('notify'); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const decide = () => {
    if (isStandalone()) {
      // 앱으로 열었으면 설치된 것 — 안내하지 않는다
      set(key(slug, 'state'), 'installed');
    } else {
      const e = detectEnv();
      setEnv(e);
      const q = new URLSearchParams(window.location.search);
      const state = get(key(slug, 'state'));
      const fromChecklist = q.get('install') === '1';
      const justCreated = q.get('welcome') === '1';
      // 휴대폰 방문 횟수 (탭을 새로 열 때마다 1번)
      let revisit = false;
      if (e !== 'desktop') {
        let counted = false;
        try { counted = window.sessionStorage.getItem(key(slug, 'counted')) === '1'; window.sessionStorage.setItem(key(slug, 'counted'), '1'); } catch { counted = true; }
        if (!counted) {
          const n = Number(get(key(slug, 'visits')) ?? '0') + 1;
          set(key(slug, 'visits'), String(n));
          revisit = n >= REVISIT_AT && !get(key(slug, 'revisitShown'));
        }
      }
      if (fromChecklist) {
        setOpen(true);
        q.delete('install');
        const s = q.toString();
        window.history.replaceState(null, '', `${window.location.pathname}${s ? `?${s}` : ''}`);
      } else if (state !== 'installed' && state !== 'dismissed' && (justCreated || revisit)) {
        setOpen(true);
        if (revisit) set(key(slug, 'revisitShown'), '1');
      }
    }
    };
    // 화면이 먼저 그려진 뒤(0.6초) 열지 정한다
    const timer = window.setTimeout(decide, 600);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [slug]);

  if (!open) return null;

  function later() {
    if (get(key(slug, 'state')) !== 'installed') set(key(slug, 'state'), 'dismissed');
    setOpen(false);
  }

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const r = await evt.userChoice.catch(() => ({ outcome: 'dismissed' }));
    setEvt(null);
    if (r.outcome === 'accepted') { set(key(slug, 'state'), 'installed'); setStep('notify'); }
  }

  async function copy() {
    await navigator.clipboard?.writeText(installUrl).catch(() => undefined);
    setCopied(true);
  }

  return (
    <div className="install-sheet-bg" role="presentation" onClick={later}>
      <div className="install-sheet" role="dialog" aria-modal="true" aria-labelledby="install-sheet-title" onClick={(e) => e.stopPropagation()}>
        {step === 'notify' ? (
          <>
            <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden="true">🔔</div>
            <h2 id="install-sheet-title" style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>설치했습니다. 이제 알림을 켜 주세요</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#4A5568' }}>
              홈 화면의 <b>{appName}</b> 앱을 열고 <b>설정 › 앱 알림</b>에서 &lsquo;이 기기에서 받기&rsquo;를 누르면, 새 상담이 들어올 때 휴대폰으로 바로 알려 드립니다.
            </p>
            <Link href={`/${slug}/admin/settings#app-notify`} onClick={() => setOpen(false)} style={{ ...BTN, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>알림 켜러 가기</Link>
            <button type="button" style={GHOST} onClick={() => setOpen(false)}>닫기</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden="true">📲</div>
            <h2 id="install-sheet-title" style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>관리자 화면을 휴대폰 앱으로 쓰세요</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#4A5568' }}>
              홈 화면에 설치하면 앱처럼 바로 열리고, <b>새 상담이 들어올 때 앱 알림</b>을 받을 수 있습니다. 앱 스토어 설치는 필요 없습니다.
            </p>

            {env === 'android' && (evt ? (
              <button type="button" style={BTN} onClick={install}>홈 화면에 설치</button>
            ) : (
              <ol className="install-steps">
                <li>오른쪽 위 <b>⋮ 메뉴</b>(삼성 인터넷은 아래 <b>≡</b>)를 누릅니다.</li>
                <li><b>&lsquo;앱 설치&rsquo;</b> 또는 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 누릅니다.</li>
                <li>홈 화면에 생긴 <b>{appName}</b> 아이콘으로 열면 됩니다.</li>
              </ol>
            ))}

            {env === 'ios' && (
              <ol className="install-steps">
                <li>화면 아래(아이패드는 위)의 <b>공유 버튼</b> <span aria-label="공유 아이콘" style={{ display: 'inline-block', padding: '0 6px', border: '1px solid #C8CDD5', borderRadius: 6 }}>⬆︎</span> 을 누릅니다.</li>
                <li>목록을 내려 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 누르고, 오른쪽 위 <b>추가</b>를 누릅니다.</li>
                <li>홈 화면에 생긴 <b>{appName}</b> 아이콘으로 열면 됩니다. 아이폰은 이렇게 설치한 앱에서만 알림을 받을 수 있습니다.</li>
              </ol>
            )}

            {env === 'inapp' && (
              <>
                <div style={{ padding: 12, borderRadius: 10, background: '#FBF1CF', color: '#5A4A12', fontSize: 14, lineHeight: 1.65 }}>
                  카카오톡·네이버 앱 안에서는 설치가 되지 않습니다. 주소를 복사해 <b>사파리(아이폰)</b>나 <b>크롬(안드로이드)</b>에 붙여 넣어 열어 주세요. 오른쪽 위 메뉴의 &lsquo;다른 브라우저로 열기&rsquo;를 눌러도 됩니다.
                </div>
                <button type="button" style={BTN} onClick={copy}>{copied ? '복사했습니다 ✓' : '주소 복사'}</button>
              </>
            )}

            {env === 'desktop' && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="install-qr" aria-label="관리자 화면 QR 코드" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <div style={{ flex: '1 1 180px', fontSize: 14, lineHeight: 1.7, color: '#3E4652' }}>
                  휴대폰 카메라로 QR 코드를 찍으면 관리자 화면이 열립니다. 같은 구글 계정으로 로그인하면 설치 방법이 나옵니다.
                  <div style={{ marginTop: 8, fontSize: 13, color: '#5A6270', wordBreak: 'break-all' }}>{installUrl.replace(/^https?:\/\//, '').replace(/\?.*$/, '')}</div>
                </div>
              </div>
            )}

            <button type="button" style={GHOST} onClick={later}>나중에</button>
            <div style={{ fontSize: 12, color: '#8A93A0', textAlign: 'center' }}>나중에도 대시보드의 시작 체크리스트에서 다시 열 수 있습니다.</div>
          </>
        )}
      </div>
      <style>{`
        .install-sheet-bg { position: fixed; inset: 0; z-index: 10000; background: rgba(14,23,48,0.5); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .install-sheet { width: 100%; max-width: 440px; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box; background: #FFFFFF; border-radius: 18px; padding: 24px; display: flex; flex-direction: column; gap: 14px; color: #1B2430; font-family: 'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif; box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
        .install-steps { margin: 0; padding: 14px 14px 14px 32px; border-radius: 10px; background: #F4F2EE; display: flex; flex-direction: column; gap: 8px; font-size: 15px; line-height: 1.6; }
        .install-qr { width: 160px; height: 160px; flex-shrink: 0; padding: 8px; border: 1px solid #E2DDD2; border-radius: 12px; box-sizing: border-box; }
        .install-qr svg { width: 100%; height: 100%; display: block; }
        @media (max-width: 760px) {
          .install-sheet-bg { align-items: flex-end; padding: 0; }
          .install-sheet { max-width: none; border-radius: 18px 18px 0 0; padding: 24px 20px calc(20px + env(safe-area-inset-bottom)); max-height: 90vh; }
        }
      `}</style>
    </div>
  );
}
