import { describe, expect, it } from 'vitest';
import { fileExt, parseResource, safeFileName } from '../resources';

const stored = (u: string) => u.startsWith('https://x.public.blob.vercel-storage.com/');
const F = (name: string) => ({ url: `https://x.public.blob.vercel-storage.com/a/${name}`, name, size: 1000 });

describe('parseResource', () => {
  it('정상 입력', () => {
    const r = parseResource({ title: ' 11월 가정통신문 ', files: [F('통신문.hwp')], visibility: 'link' }, stored);
    expect(r.ok && r.data.title).toBe('11월 가정통신문');
    expect(r.ok && r.data.visibility).toBe('link');
    expect(r.ok && r.data.files[0].type).toBe('application/x-hwp');
  });
  it('제목·내용 없음, 외부 주소, 허용 안 된 형식은 거절', () => {
    expect(parseResource({ title: '', files: [F('a.pdf')] }, stored).ok).toBe(false);
    expect(parseResource({ title: '제목' }, stored).ok).toBe(false);
    expect(parseResource({ title: '제목', files: [{ url: 'https://evil.com/a.pdf', name: 'a.pdf' }] }, stored).ok).toBe(false);
    expect(parseResource({ title: '제목', files: [F('a.exe')] }, stored).ok).toBe(false);
    expect(parseResource({ title: '제목', files: Array.from({ length: 6 }, (_, i) => F(`${i}.pdf`)) }, stored).ok).toBe(false);
  });
  it('파일 이름 정리', () => {
    expect(fileExt('통신문.HWPX')).toBe('hwpx');
    expect(safeFileName('C:\\Users\\a\\<b>.pdf')).toBe('b.pdf');
  });
});
