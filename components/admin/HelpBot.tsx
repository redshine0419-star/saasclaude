'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HELP_TOPICS, HELP_CONTACT_EMAIL } from '@/lib/admin-help/content';
import { searchHelp, topicForPath, type HelpFaq, type HelpTopic } from '@/lib/admin-help/search';

/**
 * 관리자 사용법 도우미 (AI 없음). 지금 보고 있는 메뉴의 사용법을 먼저 보여 주고,
 * 질문을 입력하면 도움말 FAQ에서 가까운 답을 찾아 보여 준다. 질문 내용은 서버로 보내지 않는다.
 */

type Msg =
  | { id: number; from: 'user'; text: string }
  | { id: number; from: 'bot'; kind: 'topic'; topic: HelpTopic }
  | { id: number; from: 'bot'; kind: 'answers'; hits: { topic: HelpTopic; faq: HelpFaq }[] }
  | { id: number; from: 'bot'; kind: 'faq'; topic: HelpTopic; faq: HelpFaq }
  | { id: number; from: 'bot'; kind: 'none' }
  | { id: number; from: 'bot'; kind: 'menus' };

type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, 'id'> : never) : never;

const FONT = "'IBM Plex Sans KR','Apple SD Gothic Neo',sans-serif";
const chip: React.CSSProperties = { padding: '7px 11px', borderRadius: 16, border: '1px solid #D5D0C6', background: '#FFFFFF', color: '#1B2430', font: 'inherit', fontSize: 13, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 };
const bubble: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #EEEAE2', borderRadius: '4px 14px 14px 14px', padding: '12px 14px', fontSize: 14, lineHeight: 1.65, color: '#1B2430', maxWidth: '100%', boxSizing: 'border-box', wordBreak: 'keep-all', overflowWrap: 'anywhere' };

export function HelpBot({ slug }: { slug: string }) {
  const pathname = usePathname() ?? '';
  const current = topicForPath(pathname, slug, HELP_TOPICS);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const seq = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const shownFor = useRef<string | null>(null);

  const push = (...m: NewMsg[]) =>
    setMsgs((prev) => [...prev, ...m.map((x) => ({ ...x, id: ++seq.current }) as Msg)]);

  // 열 때(또는 열린 채 메뉴를 옮겼을 때) 지금 메뉴 안내를 띄운다
  useEffect(() => {
    if (!open) return;
    const key = current?.key ?? '__none';
    if (shownFor.current === key) return;
    shownFor.current = key;
    push(current ? { from: 'bot', kind: 'topic', topic: current } : { from: 'bot', kind: 'menus' } as NewMsg);
  }, [open, current]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function ask(q: string) {
    const query = q.trim().slice(0, 200);
    if (!query) return;
    const hits = searchHelp(query, HELP_TOPICS, { currentKey: current?.key, limit: 3 });
    push({ from: 'user', text: query }, hits.length ? { from: 'bot', kind: 'answers', hits } : { from: 'bot', kind: 'none' });
    setText('');
  }

  function showFaq(topic: HelpTopic, faq: HelpFaq) {
    push({ from: 'user', text: faq.q }, { from: 'bot', kind: 'faq', topic, faq });
  }

  // 모바일 글쓰기 화면은 하단 고정 바가 있어 버튼을 띄우지 않는다
  if (pathname.startsWith(`/${slug}/admin/mobile`)) return null;

  const menuHref = (t: HelpTopic) => `/${slug}/admin${t.path ? `/${t.path}` : ''}`;

  function renderBot(m: Exclude<Msg, { from: 'user' }>) {
    switch (m.kind) {
      case 'topic':
        return (
          <div style={bubble}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.topic.label} 사용법</div>
            <div style={{ color: '#3E4652' }}>{m.topic.summary}</div>
            {m.topic.steps.length > 0 && (
              <ol style={{ margin: '8px 0 0', paddingLeft: 20, listStyle: 'decimal' }}>
                {m.topic.steps.map((s, i) => <li key={i} style={{ marginTop: 2 }}>{s}</li>)}
              </ol>
            )}
            {m.topic.faqs.length > 0 && (
              <>
                <div style={{ marginTop: 10, fontSize: 12, color: '#5A6270', fontWeight: 600 }}>자주 묻는 질문</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {m.topic.faqs.slice(0, 6).map((f) => (
                    <button key={f.q} type="button" style={chip} onClick={() => showFaq(m.topic, f)}>{f.q}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      case 'faq':
        return <Answer topic={m.topic} faq={m.faq} href={menuHref(m.topic)} here={m.topic.key === current?.key} />;
      case 'answers':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {m.hits.map((h, i) => (
              <Answer key={i} topic={h.topic} faq={h.faq} href={menuHref(h.topic)} here={h.topic.key === current?.key} showQ />
            ))}
          </div>
        );
      case 'none':
        return (
          <div style={bubble}>
            딱 맞는 답을 찾지 못했습니다. 짧은 낱말로 다시 물어보시거나(예: &ldquo;직원 초대&rdquo;, &ldquo;야간 발송&rdquo;), 아래에서 메뉴를 골라 사용법을 보세요.
            <div style={{ marginTop: 8 }}>
              <button type="button" style={chip} onClick={() => push({ from: 'bot', kind: 'menus' })}>메뉴별 사용법 보기</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#5A6270' }}>그래도 해결되지 않으면 {HELP_CONTACT_EMAIL} 로 문의해 주세요.</div>
          </div>
        );
      case 'menus':
        return (
          <div style={bubble}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>어떤 메뉴의 사용법을 볼까요?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {HELP_TOPICS.map((t) => (
                <button key={t.key} type="button" style={chip} onClick={() => push({ from: 'user', text: `${t.label} 사용법` }, { from: 'bot', kind: 'topic', topic: t })}>{t.label}</button>
              ))}
            </div>
          </div>
        );
    }
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="사용법 도우미 열기"
          className="adm-help-fab"
          style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 90, height: 48, padding: '0 18px', borderRadius: 24, border: 'none', background: '#1B2430', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(27,36,48,0.25)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span aria-hidden="true" style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: 11, background: '#F5B700', color: '#1B2430', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>?</span>
          사용법
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="사용법 도우미"
          className="adm-help-panel"
          style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 95, width: 'min(380px, calc(100vw - 32px))', height: 'min(600px, calc(100dvh - 32px))', background: '#F4F2EE', borderRadius: 16, boxShadow: '0 12px 40px rgba(27,36,48,0.28)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div style={{ background: '#1B2430', color: '#FFFFFF', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>사용법 도우미</div>
              <div style={{ fontSize: 12, color: '#C8CDD5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current ? `지금 메뉴: ${current.label}` : '메뉴를 골라 주세요'}</div>
            </div>
            <button type="button" onClick={() => push({ from: 'bot', kind: 'menus' })} style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid #3E4652', background: 'transparent', color: '#FFFFFF', font: 'inherit', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>전체 메뉴</button>
            <button type="button" onClick={() => setOpen(false)} aria-label="닫기" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: '#FFFFFF', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m) =>
              m.from === 'user' ? (
                <div key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#1E5645', color: '#FFFFFF', borderRadius: '14px 4px 14px 14px', padding: '9px 12px', fontSize: 14, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{m.text}</div>
              ) : (
                <div key={m.id} style={{ alignSelf: 'stretch' }}>{renderBot(m)}</div>
              ),
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); ask(text); }}
            style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #E2DDD2', background: '#FFFFFF', flexShrink: 0, flexWrap: 'nowrap' }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="궁금한 점을 적어 주세요 (예: 직원 초대)"
              maxLength={200}
              aria-label="질문"
              style={{ flex: 1, minWidth: 0, height: 40, padding: '0 12px', border: '1px solid #D5D0C6', borderRadius: 8, font: 'inherit', fontSize: 16, background: '#FAF9F6' }}
            />
            <button type="submit" style={{ height: 40, padding: '0 14px', border: 'none', borderRadius: 8, background: '#1E5645', color: '#FFFFFF', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>묻기</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Answer({ topic, faq, href, here, showQ }: { topic: HelpTopic; faq: HelpFaq; href: string; here: boolean; showQ?: boolean }) {
  return (
    <div style={bubble}>
      {showQ && <div style={{ fontWeight: 700, marginBottom: 4 }}>{faq.q}</div>}
      <div style={{ whiteSpace: 'pre-line' }}>{faq.a}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#5A6270' }}>
        {here ? <>메뉴: {topic.label}</> : <Link href={href} style={{ color: '#1E5645', fontWeight: 600 }}>{topic.label} 메뉴로 가기 →</Link>}
      </div>
    </div>
  );
}
