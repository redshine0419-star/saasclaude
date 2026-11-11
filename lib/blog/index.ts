import { plainText } from './markdown';

/** 첫등원 블로그 (growweb.me/blog) — 운영자만 쓴다 */

export const BLOG_CATEGORIES = [
  { key: 'tips', label: '운영 노하우' },
  { key: 'law', label: '법규·행정' },
  { key: 'marketing', label: '홍보·마케팅' },
  { key: 'news', label: '첫등원 소식' },
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number]['key'];

export function categoryLabel(key: string): string {
  return BLOG_CATEGORIES.find((c) => c.key === key)?.label ?? '운영 노하우';
}
export function isCategory(key: unknown): key is BlogCategory {
  return BLOG_CATEGORIES.some((c) => c.key === key);
}

/** 초안에서 사실 확인이 필요한 문장 표시 — 이 표시가 남아 있으면 공개할 수 없다 */
export const UNCHECKED_MARK = '【확인 필요】';

/** 글 주소: 영문 소문자·숫자·하이픈 2~80자 */
export const BLOG_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export type BlogInput = {
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  category: BlogCategory;
  coverImage: string | null;
  seoTitle: string | null;
  pinned: boolean;
  status: 'draft' | 'published';
  publishedAt: Date | null;
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** 운영자 입력 검사 — 저장 전에 서버에서 쓴다 */
export function parseBlogInput(raw: unknown, isAllowedImage: (url: string) => boolean): { ok: true; data: BlogInput } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const slug = str(r.slug, 80).toLowerCase();
  const title = str(r.title, 120);
  const body = typeof r.body === 'string' ? r.body.slice(0, 60000) : '';
  if (!title) return { ok: false, error: '제목을 입력해 주세요.' };
  if (!BLOG_SLUG_RE.test(slug)) return { ok: false, error: '글 주소는 영문 소문자·숫자·하이픈(-)으로 2자 이상 써 주세요. 예: tuition-change' };
  const category = isCategory(r.category) ? r.category : 'tips';
  const cover = str(r.coverImage, 500);
  if (cover && !isAllowedImage(cover)) return { ok: false, error: '대표 사진 주소가 올바르지 않습니다. 사진을 다시 올려 주세요.' };
  const status = r.status === 'published' ? 'published' : 'draft';
  if (status === 'published' && [title, body, str(r.summary, 300)].some((x) => x.includes(UNCHECKED_MARK))) {
    return { ok: false, error: `본문에 "${UNCHECKED_MARK}" 표시가 남아 있습니다. 내용을 확인하고 표시를 지운 뒤 공개해 주세요.` };
  }
  let publishedAt: Date | null = null;
  if (typeof r.publishedAt === 'string' && r.publishedAt) {
    const d = new Date(r.publishedAt);
    if (Number.isNaN(d.getTime())) return { ok: false, error: '공개 날짜가 올바르지 않습니다.' };
    publishedAt = d;
  }
  return {
    ok: true,
    data: {
      slug, title, body, category, status,
      summary: str(r.summary, 300) || null,
      coverImage: cover || null,
      seoTitle: str(r.seoTitle, 120) || null,
      pinned: r.pinned === true,
      publishedAt,
    },
  };
}

/** 요약이 없으면 본문 앞부분으로 */
export function excerpt(summary: string | null, body: string, max = 140): string {
  if (summary) return summary;
  const t = plainText(body);
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** 공개 글 조건 — 공개 상태이고 공개 날짜가 지났다 (예약 공개) */
export function publishedWhere(now = new Date()) {
  return { status: 'published', publishedAt: { lte: now } } as const;
}
