import type { ThemeKey } from '@/lib/sections';

/**
 * 새 학원 기본 사진 — 데모 학원과 같은 사진(Unsplash 무료 이미지)으로 시작한다.
 * 원장이 관리자에서 언제든 자기 사진으로 바꾸거나 뺄 수 있다. 사람 얼굴이 주인공인 사진(강사 등)은 넣지 않는다.
 * scripts/seed-sample.mjs의 LOOKS(데모 사진)와 같은 사진을 쓴다 — 바꿀 때 함께 바꾼다.
 */
const U = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

/** 메인 사진: 0번은 첫 화면, 1번부터는 섹션 옆 사진(마지막 장은 오시는 길) */
export const SAMPLE_HERO_PHOTOS: Record<ThemeKey, string[]> = {
  warm: [U('photo-1434030216411-0b793f4b4173', 1400), U('photo-1509062522246-3755977927d7'), U('photo-1503676260728-1c00da094a0b', 900), U('photo-1562774053-701939374585')],
  result: [U('photo-1434030216411-0b793f4b4173'), U('photo-1509062522246-3755977927d7'), U('photo-1453738773917-9c3eff1db985', 500), U('photo-1434648957308-5e6a859697e8', 500), U('photo-1562774053-701939374585')],
  bright: [U('photo-1509062522246-3755977927d7', 1000), U('photo-1503676260728-1c00da094a0b', 700), U('photo-1503454537195-1dcabb73ffb9', 700), U('photo-1562774053-701939374585')],
};

/** 반 사진 — 반을 만들 때 순서대로 하나씩 넣는다 */
export const SAMPLE_CLASS_PHOTOS: string[] = [
  U('photo-1497633762265-9d179a990aa6', 700),
  U('photo-1453738773917-9c3eff1db985', 700),
  U('photo-1509228468518-180dd4864904', 700),
  U('photo-1503676260728-1c00da094a0b', 700),
];

const ALL = new Set([...Object.values(SAMPLE_HERO_PHOTOS).flat(), ...SAMPLE_CLASS_PHOTOS]);

/** 기본 사진 주소인지 (관리자 저장 시 우리 저장소 사진과 함께 허용) */
export function isSamplePhoto(url: string): boolean {
  return ALL.has(url);
}
