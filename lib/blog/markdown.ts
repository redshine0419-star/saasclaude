/**
 * 블로그 본문용 작은 마크다운 해석기 — HTML을 만들지 않고 블록 목록을 돌려준다(React로 그려서 XSS 걱정이 없다).
 * 지원: ## / ### 소제목, 문단, - 목록, 1. 목록, > 인용, --- 구분선, ![설명](주소) 사진, | 표 |, [[진단]] 버튼 자리
 * 글자 꾸밈: **굵게**, `코드`, [글자](주소)
 */

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'bold'; c: Inline[] }
  | { t: 'code'; v: string }
  | { t: 'link'; href: string; c: Inline[] }
  | { t: 'br' };

export type Block =
  | { t: 'h2'; id: string; c: Inline[]; text: string }
  | { t: 'h3'; c: Inline[] }
  | { t: 'p'; c: Inline[] }
  /** check: 체크리스트 줄(- [ ] / - [x])이면 true·false, 보통 목록이면 null */
  | { t: 'ul'; items: Inline[][]; check: (boolean | null)[] }
  | { t: 'ol'; items: Inline[][]; start: number }
  | { t: 'quote'; c: Inline[] }
  | { t: 'hr' }
  | { t: 'img'; src: string; alt: string }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { t: 'cta' };

/** 링크로 허용하는 주소 — http(s), 사이트 안 경로, 전화·메일 */
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^https?:\/\/[^\s]+$/i.test(h)) return h;
  if (/^\/(?!\/)[^\s]*$/.test(h)) return h;
  if (/^(mailto:|tel:)[^\s]+$/i.test(h)) return h;
  if (/^#[\w-]+$/.test(h)) return h;
  return null;
}

/** 사진으로 허용하는 주소 — https 또는 사이트 안 경로 */
export function safeImg(src: string): string | null {
  const s = src.trim();
  if (/^https:\/\/[^\s]+$/i.test(s)) return s;
  if (/^\/(?!\/)[^\s]*$/.test(s)) return s;
  return null;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = '';
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = ''; } };
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    let m: RegExpMatchArray | null;
    if ((m = rest.match(/^\*\*(.+?)\*\*/))) {
      flush(); out.push({ t: 'bold', c: parseInline(m[1]) }); i += m[0].length; continue;
    }
    if ((m = rest.match(/^`([^`]+)`/))) {
      flush(); out.push({ t: 'code', v: m[1] }); i += m[0].length; continue;
    }
    if ((m = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/))) {
      const href = safeHref(m[2]);
      flush();
      if (href) out.push({ t: 'link', href, c: parseInline(m[1]) });
      else out.push({ t: 'text', v: m[1] });
      i += m[0].length; continue;
    }
    buf += src[i]; i++;
  }
  flush();
  return out;
}

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let h2n = 0;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const tr = line.trim();
    if (!tr) { i++; continue; }

    let m: RegExpMatchArray | null;
    if (/^\[\[(진단|cta)\]\]$/i.test(tr)) { blocks.push({ t: 'cta' }); i++; continue; }
    if (/^(-{3,}|\*{3,})$/.test(tr)) { blocks.push({ t: 'hr' }); i++; continue; }
    if ((m = tr.match(/^###\s+(.+)$/))) { blocks.push({ t: 'h3', c: parseInline(m[1]) }); i++; continue; }
    if ((m = tr.match(/^#{1,2}\s+(.+)$/))) {
      h2n++;
      blocks.push({ t: 'h2', id: `s${h2n}`, c: parseInline(m[1]), text: m[1].replace(/\*\*|`/g, '') });
      i++; continue;
    }
    if ((m = tr.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      const src = safeImg(m[2]);
      if (src) blocks.push({ t: 'img', src, alt: m[1] });
      i++; continue;
    }
    if (tr.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(lines[i + 1].trim())) {
      const head = cells(tr).map(parseInline);
      const rows: Inline[][][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(cells(lines[i]).map(parseInline)); i++; }
      blocks.push({ t: 'table', head, rows });
      continue;
    }
    if (/^[-*]\s+/.test(tr)) {
      const items: Inline[][] = [];
      const check: (boolean | null)[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^[-*]\s+/, '');
        const cm = text.match(/^\[( |x|X)\]\s+/);
        check.push(cm ? cm[1] !== ' ' : null);
        items.push(parseInline(cm ? text.slice(cm[0].length) : text));
        i++;
      }
      blocks.push({ t: 'ul', items, check });
      continue;
    }
    if ((m = tr.match(/^(\d+)[.)]\s+/))) {
      const start = Number(m[1]);
      const items: Inline[][] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) { items.push(parseInline(lines[i].trim().replace(/^\d+[.)]\s+/, ''))); i++; }
      blocks.push({ t: 'ol', items, start });
      continue;
    }
    if (tr.startsWith('>')) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { parts.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      blocks.push({ t: 'quote', c: joinLines(parts) });
      continue;
    }
    // 문단 — 빈 줄이나 다른 블록이 나올 때까지
    const parts: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || /^(#{1,3}\s|[-*]\s|\d+[.)]\s|>|\||!\[|-{3,}$|\[\[)/.test(t)) break;
      parts.push(t); i++;
    }
    if (parts.length === 0) { parts.push(tr); i++; }
    blocks.push({ t: 'p', c: joinLines(parts) });
  }
  return blocks;
}

function joinLines(parts: string[]): Inline[] {
  const out: Inline[] = [];
  parts.forEach((p, k) => { if (k) out.push({ t: 'br' }); out.push(...parseInline(p)); });
  return out;
}

/** 꾸밈 기호를 뺀 글자만 — 요약·읽는 시간 계산용 */
export function plainText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[[^\]]*\]\]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^(?:[-*]\s+(?:\[[ xX]\]\s+)?|>\s?)/gm, '')
    .replace(/^\d+[.)]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/-{3,}/g, ' ')
    .replace(/\*\*|`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 읽는 시간(분) — 한글 기준 분당 약 500자 */
export function readingMinutes(md: string): number {
  return Math.max(1, Math.round(plainText(md).length / 500));
}

/** 목차 — ## 소제목 */
export function tableOfContents(blocks: Block[]): { id: string; text: string }[] {
  return blocks.flatMap((b) => (b.t === 'h2' ? [{ id: b.id, text: b.text }] : []));
}

function inlineText(c: Inline[]): string {
  return c.map((x) => (x.t === 'text' || x.t === 'code' ? x.v : x.t === 'br' ? ' ' : inlineText(x.c))).join('');
}

function blockText(b: Block): string {
  switch (b.t) {
    case 'p': case 'quote': case 'h3': return inlineText(b.c);
    case 'h2': return b.text;
    case 'ul': case 'ol': return b.items.map((it) => inlineText(it)).join(' / ');
    case 'table': return b.rows.map((r) => r.map(inlineText).join(': ')).join(' / ');
    default: return '';
  }
}

/**
 * 자주 묻는 질문 — "Q."로 시작하는 소제목(### Q. …)을 질문으로, 그다음 소제목·구분선 전까지를 답으로 본다.
 * 검색엔진용 FAQPage 구조화 데이터에 쓴다.
 */
export function extractFaq(blocks: Block[]): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t !== 'h3' && b.t !== 'h2') continue;
    const head = b.t === 'h2' ? b.text : inlineText(b.c);
    const m = head.match(/^\s*Q\s*[.:)．]?\s+(.+)$/i);
    if (!m) continue;
    const parts: string[] = [];
    for (let j = i + 1; j < blocks.length; j++) {
      const n = blocks[j];
      if (n.t === 'h2' || n.t === 'h3' || n.t === 'hr' || n.t === 'cta') break;
      const t = blockText(n).replace(/^\s*A\s*[.:)．]\s*/i, '').trim();
      if (t) parts.push(t);
    }
    const a = parts.join(' ').replace(/\s+/g, ' ').trim();
    if (a) out.push({ q: m[1].trim(), a });
  }
  return out;
}
