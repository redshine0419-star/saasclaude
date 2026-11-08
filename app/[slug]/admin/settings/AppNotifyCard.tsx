'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type PushDeviceRow = { id: string; label: string | null; email: string; createdAt: string; lastUsedAt: string | null };
type Props = {
  slug: string;
  isOwner: boolean;
  myEmail: string;
  vapidKey: string | null;
  devices: PushDeviceRow[];
  pushReplacesKakao: boolean;
};

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 };
const btn: React.CSSProperties = { height: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const primary: React.CSSProperties = { ...btn, border: 'none', background: '#1E5645', color: '#FFFFFF' };
const fmt = (iso: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function keyToBytes(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function AppNotifyCard({ slug, isOwner, myEmail, vapidKey, devices, pushReplacesKakao }: Props) {
  const router = useRouter();
  const [support, setSupport] = useState<'checking' | 'ok' | 'ios-install' | 'no'>('checking');
  const [standalone, setStandalone] = useState(false);
  const [thisEndpoint, setThisEndpoint] = useState<string | null>(null);
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [replace, setReplace] = useState(pushReplacesKakao);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua);
    const inApp = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(inApp);
    const can = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    // 아이폰은 홈 화면에 추가한 앱에서만 푸시를 받을 수 있다 (iOS 16.4+)
    setSupport(can ? 'ok' : ios && !inApp ? 'ios-install' : 'no');
    if (can) {
      navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((s) => setThisEndpoint(s?.endpoint ?? null)).catch(() => {});
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e as BIPEvent); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const subscribedHere = !!thisEndpoint;

  async function turnOn() {
    if (!vapidKey) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('알림 권한이 꺼져 있습니다. 브라우저(또는 휴대폰) 설정에서 이 사이트의 알림을 허용해 주세요.');
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(() => navigator.serviceWorker.ready);
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(vapidKey) as BufferSource }));
      const res = await fetch(`/api/${slug}/admin/push`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? '알림을 켜지 못했습니다.');
      setThisEndpoint(sub.endpoint);
      setMsg('이 기기에서 알림을 받습니다. "테스트 알림 보내기"로 확인해 보세요.');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '알림을 켜지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true); setErr(''); setMsg('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/${slug}/admin/push`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setThisEndpoint(null);
      setMsg('이 기기의 알림을 껐습니다.');
      router.refresh();
    } catch {
      setErr('알림을 끄지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true); setErr(''); setMsg('');
    const res = await fetch(`/api/${slug}/admin/push/test`, { method: 'POST' }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setErr(j?.error ?? '보내지 못했습니다.');
    setMsg(`테스트 알림을 ${j.sent}대에 보냈습니다. 몇 초 안에 도착합니다.`);
  }

  async function removeDevice(id: string) {
    const res = await fetch(`/api/${slug}/admin/push`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => null);
    if (!res?.ok) return setErr('끄지 못했습니다.');
    router.refresh();
  }

  async function toggleReplace(v: boolean) {
    setReplace(v);
    const res = await fetch(`/api/${slug}/admin/push/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pushReplacesKakao: v }) }).catch(() => null);
    if (!res?.ok) { setReplace(!v); setErr('저장하지 못했습니다.'); }
  }

  async function install() {
    if (!installEvt) return;
    await installEvt.prompt();
    setInstallEvt(null);
  }

  return (
    <section style={card} aria-labelledby="app-notify-title">
      <div>
        <div id="app-notify-title" style={{ fontSize: 16, fontWeight: 700 }}>앱 설치 · 앱 알림</div>
        <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4, lineHeight: 1.6 }}>
          관리자 화면을 휴대폰 홈 화면에 앱처럼 설치하고, 새 상담·아침 미응대 알림 등을 <b>무료 앱 알림</b>으로 받습니다. 학부모에게 가는 카카오톡은 그대로입니다.
        </div>
      </div>

      {/* 설치 */}
      <div style={{ padding: 14, borderRadius: 10, background: '#FAF9F6', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, lineHeight: 1.6 }}>
        <b>1. 홈 화면에 설치</b>
        {standalone ? (
          <span style={{ color: '#1E5645' }}>지금 앱으로 열려 있습니다.</span>
        ) : installEvt ? (
          <div><button type="button" onClick={install} style={primary}>홈 화면에 앱 설치</button></div>
        ) : (
          <span style={{ color: '#3E4652' }}>
            <b>아이폰(사파리)</b>: 아래 공유 버튼 → &ldquo;홈 화면에 추가&rdquo;. <b>안드로이드(크롬·삼성 인터넷)</b>: 오른쪽 위 메뉴 → &ldquo;홈 화면에 추가&rdquo; 또는 &ldquo;앱 설치&rdquo;.
          </span>
        )}
      </div>

      {/* 알림 */}
      <div style={{ padding: 14, borderRadius: 10, background: '#FAF9F6', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, lineHeight: 1.6 }}>
        <b>2. 이 기기에서 알림 받기</b>
        {!vapidKey ? (
          <span style={{ color: '#7A4B00' }}>앱 알림이 아직 준비되지 않았습니다. 첫등원 운영팀이 설정하면 켤 수 있습니다.</span>
        ) : support === 'ios-install' ? (
          <span style={{ color: '#7A4B00' }}>아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있습니다. 1번대로 설치한 뒤, 홈 화면의 앱으로 열어 여기서 알림을 켜 주세요.</span>
        ) : support === 'no' ? (
          <span style={{ color: '#7A4B00' }}>이 브라우저는 앱 알림을 지원하지 않습니다. 휴대폰의 크롬·사파리·삼성 인터넷을 써 주세요.</span>
        ) : support === 'ok' ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: subscribedHere ? '#E4EEE9' : '#EEEAE2', color: subscribedHere ? '#1E5645' : '#5A6270' }}>{subscribedHere ? '이 기기 알림 켜짐' : '이 기기 알림 꺼짐'}</span>
            {subscribedHere ? (
              <>
                <button type="button" onClick={test} disabled={busy} style={btn}>테스트 알림 보내기</button>
                <button type="button" onClick={turnOff} disabled={busy} style={{ ...btn, color: '#B42318' }}>이 기기 알림 끄기</button>
              </>
            ) : (
              <button type="button" onClick={turnOn} disabled={busy} style={primary}>{busy ? '켜는 중…' : '이 기기에서 알림 받기'}</button>
            )}
          </div>
        ) : null}
      </div>

      {/* 카톡 대신 */}
      <label style={{ display: 'flex', flexWrap: 'nowrap', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.6, cursor: isOwner ? 'pointer' : 'default' }}>
        <input type="checkbox" checked={replace} disabled={!isOwner} onChange={(e) => toggleReplace(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
        <span>
          <b>앱 알림을 받는 기기가 있으면 카톡 알림은 보내지 않기</b>
          <span style={{ display: 'block', fontSize: 12, color: '#5A6270' }}>
            켜 두면 &ldquo;새 상담 알림 받을 번호&rdquo;로 가던 카톡 알림톡 비용이 들지 않습니다. 앱 알림이 한 대도 도착하지 않으면 자동으로 카톡으로 보냅니다.{!isOwner && ' (원장만 바꿀 수 있습니다)'}
          </span>
        </span>
      </label>

      {/* 기기 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#5A6270' }}>알림 받는 기기 {devices.length}대</div>
        {devices.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9AA3AF' }}>아직 없습니다. 지금은 새 상담 알림이 카톡으로 갑니다.</div>
        ) : (
          devices.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 8, border: '1px solid #EEEAE2', fontSize: 13 }}>
              <b style={{ fontSize: 14 }}>{d.label || '기기'}</b>
              <span style={{ color: '#5A6270', minWidth: 0, overflowWrap: 'anywhere' }}>{d.email}</span>
              <span style={{ color: '#9AA3AF', marginLeft: 'auto' }}>{d.lastUsedAt ? `마지막 알림 ${fmt(d.lastUsedAt)}` : `${fmt(d.createdAt)} 등록`}</span>
              {(isOwner || d.email === myEmail) && <button type="button" onClick={() => removeDevice(d.id)} style={{ ...btn, height: 30, fontSize: 12, color: '#B42318' }}>끄기</button>}
            </div>
          ))
        )}
      </div>

      {msg && <div role="status" style={{ fontSize: 13, color: '#1E5645' }}>{msg}</div>}
      {err && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{err}</div>}
    </section>
  );
}
