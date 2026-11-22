import { describe, it, expect } from 'vitest';
import { mainPhotoReplaced } from '../setup-checklist';
import { SAMPLE_HERO_PHOTOS } from '../sample-photos';

describe('홈페이지 완성도 — 메인 사진', () => {
  const samples = SAMPLE_HERO_PHOTOS.bright;
  const mine = 'https://abc.public.blob.vercel-storage.com/hero/my.jpg';
  it('처음(샘플 그대로)은 미완료', () => expect(mainPhotoReplaced(samples)).toBe(false));
  it('첫 화면 사진만 바꿔도 완료 (나머지는 샘플이어도)', () => expect(mainPhotoReplaced([mine, ...samples.slice(1)])).toBe(true));
  it('사진이 없으면 미완료', () => {
    expect(mainPhotoReplaced([])).toBe(false);
    expect(mainPhotoReplaced(null)).toBe(false);
  });
});
