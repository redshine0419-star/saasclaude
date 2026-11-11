import Link from 'next/link';
import type { ReactNode } from 'react';
import { parseMarkdown, type Block, type Inline } from '@/lib/blog/markdown';

/** 블로그 본문 — 마크다운을 React 요소로 그린다 (HTML을 넣지 않는다) */
export function Markdown({ source, blocks }: { source?: string; blocks?: Block[] }) {
  const list = blocks ?? parseMarkdown(source ?? '');
  return <div className="blog-prose">{list.map((b, i) => <BlockView key={i} b={b} />)}</div>;
}

function inl(c: Inline[]): ReactNode {
  return c.map((x, i) => {
    switch (x.t) {
      case 'text': return x.v;
      case 'br': return <br key={i} />;
      case 'bold': return <strong key={i}>{inl(x.c)}</strong>;
      case 'code': return <code key={i}>{x.v}</code>;
      case 'link': {
        const external = /^https?:/i.test(x.href) && !/^https:\/\/growweb\.me(\/|$)/i.test(x.href);
        return external
          ? <a key={i} href={x.href} target="_blank" rel="noopener noreferrer nofollow">{inl(x.c)}</a>
          : <a key={i} href={x.href}>{inl(x.c)}</a>;
      }
    }
  });
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'h2': return <h2 id={b.id}>{inl(b.c)}</h2>;
    case 'h3': return <h3>{inl(b.c)}</h3>;
    case 'p': return <p>{inl(b.c)}</p>;
    case 'ul': return <ul>{b.items.map((it, i) => <li key={i}>{inl(it)}</li>)}</ul>;
    case 'ol': return <ol start={b.start}>{b.items.map((it, i) => <li key={i}>{inl(it)}</li>)}</ol>;
    case 'quote': return <blockquote>{inl(b.c)}</blockquote>;
    case 'hr': return <hr />;
    case 'img':
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt={b.alt} loading="lazy" />
          {b.alt && <figcaption>{b.alt}</figcaption>}
        </figure>
      );
    case 'table':
      return (
        <div className="blog-table">
          <table>
            <thead><tr>{b.head.map((h, i) => <th key={i}>{inl(h)}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{inl(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'cta': return <BlogCta />;
  }
}

/** 무료 진단 안내 — 본문의 [[진단]] 자리와 글 끝에 쓴다 */
export function BlogCta() {
  return (
    <aside className="blog-cta">
      <div>
        <b>우리 학원 홈페이지, 상담으로 잘 이어지고 있을까요?</b>
        <span>학원 주소만 넣으면 1분 안에 무료로 진단해 드립니다.</span>
      </div>
      <Link href="/consult">무료 진단 받기 →</Link>
    </aside>
  );
}
