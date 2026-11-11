import { describe, it, expect } from 'vitest';
import { parseMarkdown, parseInline, safeHref, plainText, tableOfContents, readingMinutes } from '../markdown';
import { parseBlogInput, excerpt } from '../index';

describe('parseMarkdown', () => {
  it('블록을 나눈다', () => {
    const b = parseMarkdown(['## 첫 소제목', '', '문단 첫 줄', '둘째 줄', '', '- 하나', '- 둘', '', '1. 가', '2. 나', '', '> 팁입니다', '', '---', '', '![교실](https://x.public.blob.vercel-storage.com/a.jpg)', '', '| 항목 | 내용 |', '| --- | --- |', '| 교습비 | 30만 원 |', '', '[[진단]]', '', '### 작은 소제목'].join('\n'));
    expect(b.map((x) => x.t)).toEqual(['h2', 'p', 'ul', 'ol', 'quote', 'hr', 'img', 'table', 'cta', 'h3']);
    const p = b[1] as Extract<typeof b[number], { t: 'p' }>;
    expect(p.c.some((x) => x.t === 'br')).toBe(true);
    const t = b[7] as Extract<typeof b[number], { t: 'table' }>;
    expect(t.rows).toHaveLength(1);
    expect(tableOfContents(b)).toEqual([{ id: 's1', text: '첫 소제목' }]);
  });
  it('위험한 주소는 링크·사진으로 만들지 않는다', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('//evil.com')).toBeNull();
    expect(safeHref('https://growweb.me/consult')).toBe('https://growweb.me/consult');
    expect(safeHref('/consult')).toBe('/consult');
    const inl = parseInline('[눌러](javascript:alert(1)) **굵게**');
    expect(inl.some((x) => x.t === 'link')).toBe(false);
    expect(inl.some((x) => x.t === 'bold')).toBe(true);
    const bad = parseMarkdown('![x](javascript:alert(1))');
    expect(JSON.stringify(bad)).not.toMatch(/"t":"(img|link)"/);
    expect(parseMarkdown('![x](http://insecure/a.jpg)')).toEqual([]);
  });
  it('HTML은 글자 그대로 남는다', () => {
    const b = parseMarkdown('<script>alert(1)</script>');
    expect(b).toEqual([{ t: 'p', c: [{ t: 'text', v: '<script>alert(1)</script>' }] }]);
  });
  it('요약·읽는 시간', () => {
    expect(plainText('## 제목\n**굵게** [링크](/a)')).toBe('제목 굵게 링크');
    expect(readingMinutes('가'.repeat(1500))).toBe(3);
    expect(excerpt(null, '가'.repeat(200), 10)).toBe('가가가가가가가가가…');
  });
});

describe('parseBlogInput', () => {
  const ok = (u: string) => u.startsWith('https://x.public.blob');
  it('필수값과 주소 형식', () => {
    expect(parseBlogInput({ title: '', slug: 'a-b' }, ok).ok).toBe(false);
    expect(parseBlogInput({ title: '글', slug: '한글주소' }, ok).ok).toBe(false);
    expect(parseBlogInput({ title: '글', slug: '-bad' }, ok).ok).toBe(false);
    expect(parseBlogInput({ title: '글', slug: 'tuition-change', coverImage: 'https://evil.com/a.jpg' }, ok).ok).toBe(false);
    const r = parseBlogInput({ title: ' 글 ', slug: 'Tuition-Change', category: 'law', status: 'published', pinned: true }, ok);
    expect(r.ok && r.data).toMatchObject({ title: '글', slug: 'tuition-change', category: 'law', status: 'published', pinned: true });
    expect(parseBlogInput({ title: '글', slug: 'ab', status: 'published', body: '본문 【확인 필요】 기한' }, ok).ok).toBe(false);
    expect(parseBlogInput({ title: '글', slug: 'ab', status: 'draft', body: '본문 【확인 필요】 기한' }, ok).ok).toBe(true);
    const r2 = parseBlogInput({ title: '글', slug: 'ab', category: 'zzz' }, ok);
    expect(r2.ok && r2.data.category).toBe('tips');
  });
});
