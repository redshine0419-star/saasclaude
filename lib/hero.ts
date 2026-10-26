/**
 * 메인 히어로 문구·대표 사진 (원장 편집). 비어 있으면 테마 기본 문구를 쓴다.
 * 기본 문구에는 학원마다 다른 사실(인원·특강 모집 등)을 넣지 않는다 — 대괄호 원칙(CLAUDE.md 4).
 * 브라우저에서도 쓰므로 DB 모듈을 import하지 않는다.
 */
export const HERO_LIMITS = { badge: 20, title: 40, subtitle: 120, photos: 3 } as const;

export type HeroTheme = 'warm' | 'result' | 'bright';

export function heroDefaults(theme: HeroTheme, subjects: string | null) {
  const subj = subjects?.trim() || '공부';
  switch (theme) {
    case 'result':
      return { title: '지난 학기 성과를\n숫자로 보여드립니다', subtitle: '학교별 기출과 출제 경향을 시험 전부터 반복합니다. 결과는 매 학기 이 페이지에 공개합니다.' };
    case 'bright':
      return { title: `${subj}${hasBatchim(subj) ? '이' : '가'} 재밌어지는\n우리 동네 첫 학원`, subtitle: '말하기로 시작하는 수업. 아이가 먼저 “오늘 학원 가?” 하고 묻는 곳이 되고 싶습니다.' };
    default:
      return { title: '소수 정예로,\n원장이 직접 가르칩니다', subtitle: `${subj} 내신 대비부터 기초까지. 레벨테스트로 아이 수준을 먼저 확인하고, 맞는 반을 정해 드립니다.` };
  }
}

function hasBatchim(word: string): boolean {
  const c = word.charCodeAt(word.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
}

/** 제목 줄바꿈: 최대 2줄 */
export function titleLines(title: string): string[] {
  return title.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 2);
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
export type HeroInput = { heroBadge: string | null; heroTitle: string | null; heroSubtitle: string | null; heroPhotos: string[] };

/** isStored: 우리 저장소에 올린 사진 주소인지 (lib/storage.isStoredUrl) — 바깥 주소는 받지 않는다 */
export function parseHero(body: Record<string, unknown>, isStored: (url: string) => boolean): Result<HeroInput> {
  const text = (v: unknown, max: number, label: string): string | null | Error => {
    if (v == null || v === '') return null;
    if (typeof v !== 'string') return new Error(`${label} 형식이 올바르지 않습니다.`);
    const t = v.replace(/\r/g, '').trim();
    if (t.length > max) return new Error(`${label}은(는) ${max}자까지 쓸 수 있습니다.`);
    return t || null;
  };
  const badge = text(body.heroBadge, HERO_LIMITS.badge, '강조 문구');
  const title = text(body.heroTitle, HERO_LIMITS.title, '제목');
  const subtitle = text(body.heroSubtitle, HERO_LIMITS.subtitle, '소개 문구');
  for (const r of [badge, title, subtitle]) if (r instanceof Error) return { ok: false, error: r.message };
  if (typeof title === 'string' && title.split('\n').filter((l) => l.trim()).length > 2) return { ok: false, error: '제목은 2줄까지 쓸 수 있습니다.' };

  const photosRaw = body.heroPhotos ?? [];
  if (!Array.isArray(photosRaw) || photosRaw.some((p) => typeof p !== 'string')) return { ok: false, error: '사진 형식이 올바르지 않습니다.' };
  const photos = [...new Set(photosRaw as string[])].filter(Boolean);
  if (photos.length > HERO_LIMITS.photos) return { ok: false, error: `대표 사진은 ${HERO_LIMITS.photos}장까지 올릴 수 있습니다.` };
  if (photos.some((p) => !isStored(p))) return { ok: false, error: '사진은 이 화면에서 올린 것만 쓸 수 있습니다.' };

  return { ok: true, data: { heroBadge: badge as string | null, heroTitle: title as string | null, heroSubtitle: subtitle as string | null, heroPhotos: photos } };
}
