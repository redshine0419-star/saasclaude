import { describe, expect, it } from 'vitest';
import { heroDefaults, parseHero, titleLines } from '../hero';

const stored = (u: string) => u.startsWith('https://x.public.blob.vercel-storage.com/');
const P = (n: number) => `https://x.public.blob.vercel-storage.com/p${n}.jpg`;

describe('parseHero', () => {
  it('빈 값은 null(기본 문구 사용), 앞뒤 공백 제거', () => {
    const r = parseHero({ heroBadge: '', heroTitle: '  ', heroSubtitle: ' 소개 ', heroPhotos: [] }, stored);
    expect(r.ok && r.data).toEqual({ heroBadge: null, heroTitle: null, heroSubtitle: '소개', heroPhotos: [] });
  });
  it('길이·줄 수·사진 수·바깥 주소를 거절한다', () => {
    expect(parseHero({ heroTitle: 'a'.repeat(41) }, stored).ok).toBe(false);
    expect(parseHero({ heroTitle: '1\n2\n3' }, stored).ok).toBe(false);
    expect(parseHero({ heroPhotos: [P(1), P(2), P(3), P(4)] }, stored).ok).toBe(false);
    expect(parseHero({ heroPhotos: ['https://evil.example.com/a.jpg'] }, stored).ok).toBe(false);
    expect(parseHero({ heroPhotos: 'x' }, stored).ok).toBe(false);
  });
  it('사진 중복은 하나로', () => {
    const r = parseHero({ heroPhotos: [P(1), P(1), P(2)] }, stored);
    expect(r.ok && r.data.heroPhotos).toEqual([P(1), P(2)]);
  });
});

describe('heroDefaults / titleLines', () => {
  it('기본 문구에 학원마다 다른 숫자 주장을 넣지 않는다', () => {
    for (const t of ['warm', 'result', 'bright'] as const) {
      const d = heroDefaults(t, '수학');
      expect(`${d.title} ${d.subtitle}`).not.toMatch(/\d+명|최대 \d/);
    }
  });
  it('받침에 맞는 조사', () => {
    expect(heroDefaults('bright', '수학').title.startsWith('수학이')).toBe(true);
    expect(heroDefaults('bright', '영어').title.startsWith('영어가')).toBe(true);
  });
  it('제목은 2줄까지', () => {
    expect(titleLines('a\n\nb\nc')).toEqual(['a', 'b']);
  });
});
