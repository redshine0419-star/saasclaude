'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Device = { id: string; email: string; label: string | null; lastUsedAt: string | null; createdAt: string };
type Props = { vapidKey: string | null; devices: Device[] };

const btn: React.CSSProperties = { height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const primary: React.CSSProperties = { ...btn, border: 'none', background: '#1E5645', color: '#FFFFFF' };
const fmt = (iso: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function keyToBytes(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** 운영자 앱 알림 — 새 학원 개설·회원가입을 휴대폰 알림으로 받는다 */
export function OperatorPushCard({ vapidKey, devices }: Props) {
  const router = useRouter();
  const [support, setSupport] = useState<'checking' | 'ok' | 'ios-install' | 'no'>('checking');
  const [here, setHere] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const inApp = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const can = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupport(can ? 'ok' : ios && !inApp ? 'ios-install' : 'no');
    if (can) navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => setHere(s?.endpoint ?? null)).catch(() => {});
  }, []);

  async function on() {
    if (!vapidKey) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      if ((await Notification.requestPermission()) !== 'granted') throw new Error('알림 권한이 꺼져 있습니다. 브라우저 설정에서 허용해 주세요.');
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(() => navigator.serviceWorker.ready);
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(vapidKey) as BufferSource }));
      const res = await fetch('/api/platform/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? '알림을 켜지 못했습니다.');
      setHere(sub.endpoint);
      setMsg('이 기기에서 운영 알림을 받습니다.');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '알림을 켜지 못했습니다.');
    } finally { setBusy(false); }
  }

  async function off(id?: string) {
    setBusy(true); setErr(''); setMsg('');
    try {
      if (id) {
        await fetch('/api/platform/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      } else {
        const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
        if (sub) {
          await fetch('/api/platform/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
          await sub.unsubscribe();
        }
        setHere(null);
      }
      router.refresh();
    } catch { setErr('끄지 못했습니다.'); } finally { setBusy(false); }
  }

  async function test() {
    setBusy(true); setErr(''); setMsg('');
    const res = await fetch('/api/platform/push/test', { method: 'POST' }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return setErr(j?.error ?? '보내지 못했습니다.');
    setMsg(`테스트 알림을 ${j.sent}대에 보냈습니다.`);
  }

  return (
    <section style={{ background: '#FFFFFF', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby="op-push-title">
      <div>
        <div id="op-push-title" style={{ fontSize: 16, fontWeight: 700 }}>운영 앱 알림</div>
        <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4, lineHeight: 1.6 }}>
          새 학원 개설과 회원가입을 휴대폰 알림으로 받습니다. 휴대폰에서 이 화면(growweb.me/platform)을 홈 화면에 추가한 뒤 켜는 것을 권합니다(아이폰은 필수).
        </div>
      </div>
      {!vapidKey ? (
        <div style={{ fontSize: 13, color: '#7A4B00' }}>앱 알림 키(VAPID_PUBLIC_KEY·VAPID_PRIVATE_KEY)가 아직 환경변수에 없습니다.</div>
      ) : support === 'ios-install' ? (
        <div style={{ fontSize: 13, color: '#7A4B00' }}>아이폰은 사파리 공유 버튼 → &ldquo;홈 화면에 추가&rdquo; 후, 홈 화면의 앱으로 열어서 켜 주세요.</div>
      ) : support === 'no' ? (
        <div style={{ fontSize: 13, color: '#7A4B00' }}>이 브라우저는 앱 알림을 지원하지 않습니다.</div>
      ) : support === 'ok' ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: here ? '#E4EEE9' : '#EEEAE2', color: here ? '#1E5645' : '#5A6270' }}>{here ? '이 기기 알림 켜짐' : '이 기기 알림 꺼짐'}</span>
          {here ? (
            <>
              <button type="button" onClick={test} disabled={busy} style={btn}>테스트 알림 보내기</button>
              <button type="button" onClick={() => off()} disabled={busy} style={{ ...btn, color: '#B42318' }}>이 기기 알림 끄기</button>
            </>
          ) : (
            <button type="button" onClick={on} disabled={busy} style={primary}>{busy ? '켜는 중…' : '이 기기에서 알림 받기'}</button>
          )}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#5A6270' }}>알림 받는 운영자 기기 {devices.length}대</div>
        {devices.map((d) => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 8, border: '1px solid #EEEAE2', fontSize: 13 }}>
            <b>{d.label || '기기'}</b>
            <span style={{ color: '#5A6270', overflowWrap: 'anywhere' }}>{d.email}</span>
            <span style={{ color: '#9AA3AF', marginLeft: 'auto' }}>{d.lastUsedAt ? `마지막 알림 ${fmt(d.lastUsedAt)}` : `${fmt(d.createdAt)} 등록`}</span>
            <button type="button" onClick={() => off(d.id)} disabled={busy} style={{ ...btn, height: 30, fontSize: 12, color: '#B42318' }}>끄기</button>
          </div>
        ))}
      </div>
      {msg && <div role="status" style={{ fontSize: 13, color: '#1E5645' }}>{msg}</div>}
      {err && <div role="alert" style={{ fontSize: 13, color: '#B42318' }}>{err}</div>}
    </section>
  );
}
