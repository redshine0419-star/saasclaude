'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatKstDate } from '@/lib/format-date';
import { DISCLOSURE_EXAMPLE, EVENTS, FEEDBACK_MIN, type EventKind } from '@/lib/events';

type Claim = { id: string; kind: string; status: string; createdAt: string; rejectReason: string | null; freeUntil: string | null; appliedTo: string | null };
type Props = { slug: string; isOwner: boolean; isDemo: boolean; claims: Claim[] };

const card: React.CSSProperties = { background: '#FFFFFF', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 };
const BTN: React.CSSProperties = { height: 42, padding: '0 18px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const INPUT: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 14, background: '#FFFFFF', color: '#1B2430' };

function StatusLine({ c }: { c: Claim }) {
  if (c.status === 'approved') {
    return (
      <div style={{ padding: '10px 12px', borderRadius: 8, background: '#E4EEE9', color: '#1E5645', fontSize: 14, fontWeight: 600 }}>
        ✓ 혜택 적용됨 — {c.freeUntil ? (c.appliedTo === 'subscription' ? `다음 결제일 ${formatKstDate(c.freeUntil)}` : `${formatKstDate(c.freeUntil)}까지 무료`) : '적용 완료'}
      </div>
    );
  }
  if (c.status === 'pending') {
    return <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FBF1CF', color: '#5A4A12', fontSize: 14 }}>확인 중입니다 ({formatKstDate(c.createdAt)} 신청). 승인되면 알림으로 알려 드립니다.</div>;
  }
  return <div style={{ padding: '10px 12px', borderRadius: 8, background: '#FDECEA', color: '#B42318', fontSize: 14 }}>반려됨 — {c.rejectReason ?? '사유 없음'}. 고쳐서 다시 신청할 수 있습니다.</div>;
}

function EventBlock({ kind, slug, claims, canApply }: { kind: EventKind; slug: string; claims: Claim[]; canApply: boolean }) {
  const router = useRouter();
  const ev = EVENTS[kind];
  const latest = claims.find((c) => c.kind === kind);
  const done = claims.some((c) => c.kind === kind && (c.status === 'approved' || c.status === 'pending'));
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [checks, setChecks] = useState({ ownPublic: false, disclosure: false, noPersonal: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const ready = kind === 'feedback' ? content.trim().length >= FEEDBACK_MIN : url.trim() && checks.ownPublic && checks.disclosure && checks.noPersonal;

  async function submit() {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/${slug}/admin/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kind === 'feedback' ? { kind, content } : { kind, url, ...checks }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setErr(d.error ?? '신청하지 못했습니다.');
      setOpen(false);
      router.refresh();
    } catch {
      setErr('신청하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 16, borderRadius: 10, border: '1px solid #E2DDD2', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ padding: '2px 8px', borderRadius: 6, background: '#1E5645', color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>{ev.months}개월 무료</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{ev.title}</span>
      </div>
      <div style={{ fontSize: 14, color: '#5A6270', lineHeight: 1.7 }}>{ev.short}</div>
      {latest && <StatusLine c={latest} />}

      {!done && canApply && !open && (
        <button type="button" style={{ ...BTN, alignSelf: 'flex-start' }} onClick={() => setOpen(true)}>{latest ? '다시 신청하기' : '신청하기'}</button>
      )}

      {!done && canApply && open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {kind === 'feedback' ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
              개선 제안 ({content.trim().length}/{FEEDBACK_MIN}자 이상)
              <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="예: 상담 목록에서 학년별로 거를 수 있으면 좋겠어요. 휴대폰에서 반 시간표를 고칠 때 ○○이 불편했어요." style={{ ...INPUT, resize: 'vertical', lineHeight: 1.7, fontWeight: 400 }} />
            </label>
          ) : (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
                블로그 글 주소
                <input type="url" inputMode="url" autoCapitalize="none" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://blog.naver.com/..." style={{ ...INPUT, fontWeight: 400 }} />
              </label>
              <div style={{ padding: 12, borderRadius: 8, background: '#FAF9F6', fontSize: 13, lineHeight: 1.7, color: '#3E4652' }}>
                혜택을 받고 쓰는 글은 그 사실을 글에 밝혀야 합니다(표시광고법 추천·보증 심사지침). 글 처음이나 끝에 이렇게 넣어 주세요.
                <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 6, background: '#FFFFFF', border: '1px dashed #D5D0C6', fontWeight: 600 }}>{DISCLOSURE_EXAMPLE}</div>
              </div>
              {([
                ['ownPublic', '제가 직접 쓴 글을 전체 공개로 올렸습니다.'],
                ['disclosure', '글에 더클에서 무료 이용 혜택을 받았다는 문구를 넣었습니다.'],
                ['noPersonal', '글에 학생 이름·얼굴 등 개인정보가 없습니다.'],
              ] as const).map(([k, label]) => (
                <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.5, cursor: 'pointer' }}>
                  <input type="checkbox" checked={checks[k]} onChange={(e) => setChecks((c) => ({ ...c, [k]: e.target.checked }))} style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0 }} />
                  {label}
                </label>
              ))}
            </>
          )}
          {err && <div style={{ color: '#B42318', fontSize: 13 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ ...BTN, opacity: ready && !busy ? 1 : 0.5, cursor: ready && !busy ? 'pointer' : 'not-allowed' }} disabled={!ready || busy} onClick={submit}>{busy ? '보내는 중…' : '보내기'}</button>
            <button type="button" style={{ ...BTN, background: '#FFFFFF', color: '#1B2430', border: '1px solid #D5D0C6', fontWeight: 500 }} onClick={() => setOpen(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EventsCard({ slug, isOwner, isDemo, claims }: Props) {
  const canApply = isOwner && !isDemo;
  return (
    <section style={card} aria-labelledby="ev-h">
      <div>
        <h2 id="ev-h" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🎁 무료 기간 늘리기 이벤트</h2>
        <div style={{ fontSize: 13, color: '#5A6270', marginTop: 4, lineHeight: 1.7 }}>
          이벤트마다 학원당 한 번 받을 수 있습니다. 운영자가 확인한 뒤 무료 종료일을 늘려 드리고, 이미 결제 중이면 다음 결제일을 그만큼 늦춥니다.
        </div>
      </div>
      {!isOwner && <div style={{ fontSize: 13, color: '#8A93A8' }}>원장님 계정에서 신청할 수 있습니다.</div>}
      {isDemo && <div style={{ fontSize: 13, color: '#8A93A8' }}>데모 학원에서는 신청할 수 없습니다.</div>}
      <EventBlock kind="feedback" slug={slug} claims={claims} canApply={canApply} />
      <EventBlock kind="blog" slug={slug} claims={claims} canApply={canApply} />
    </section>
  );
}
