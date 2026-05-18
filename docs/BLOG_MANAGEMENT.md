# 블로그 관리 가이드

> 이 문서만 읽으면 블로그 관련 모든 작업을 독립적으로 수행할 수 있습니다.

---

## 1. 구조 한눈에 보기

```
콘텐츠 저장소: Vercel Blob (로컬 파일시스템 아님)
  posts-index-ko.json      ← KO 포스트 목록 (slug, title, tags, createdAt)
  posts-index-en.json      ← EN 포스트 목록
  posts-index-ja.json      ← JA 포스트 목록
  posts/ko/{slug}.json     ← KO 개별 포스트 (content, faq, metaDescription 등)
  posts/en/{slug}.json     ← EN 개별 포스트
  posts/ja/{slug}.json     ← JA 개별 포스트
  blog-schedule-ko.json    ← KO 자동발행 설정
  blog-schedule-en.json    ← EN 자동발행 설정
  blog-schedule-ja.json    ← JA 자동발행 설정

프론트엔드: app/blog/[lang]/page.tsx (목록), app/blog/[lang]/[slug]/page.tsx (상세)
관리 UI:    components/BlogAdminModule.tsx (어드민만 접근 가능)
```

---

## 2. API 엔드포인트

| 엔드포인트 | 메서드 | 용도 | 인증 |
|-----------|--------|------|------|
| `/api/blog/posts` | GET | 포스트 목록 조회 (`?lang=ko`) | 불필요 |
| `/api/blog/posts` | PUT | 새 포스트 저장 | **admin** |
| `/api/blog/posts` | DELETE | 포스트 삭제 (`?lang=ko&slug=xxx`) | **admin** |
| `/api/blog/posts/[slug]` | GET | 단일 포스트 조회 (`?lang=ko`) | 불필요 |
| `/api/blog/generate` | POST | AI로 포스트 생성 | **admin** |
| `/api/blog/schedule` | GET | 자동발행 설정 조회 (`?lang=ko`) | **admin** |
| `/api/blog/schedule` | POST | 자동발행 설정 저장 | **admin** |
| `/api/blog/cron` | GET | 크론 실행 (Vercel Cron 트리거) | CRON_SECRET |
| `/api/blog/cron` | POST | 즉시 테스트 발행 | **admin** |
| `/api/blog/medium` | POST | Medium 발행 | **admin** |

---

## 3. 포스트 생성 방식

### 단일 포스트 즉시 생성 (코드로)

```typescript
// POST /api/blog/generate
{
  "lang": "ko",          // "ko" | "en" | "ja"
  "keyword": "GA4 자동 리포트 만드는 법",
  "targetAudience": "1인 마케터",
  "tone": "친근하고 실용적인",
  "postDate": "2026-05-18"   // 발행일 (선택)
}
```

응답: `BlogPost` 객체 (title, slug, content, metaDescription, tags, faq)

### 자동발행 설정 (ScheduleConfig)

```typescript
// POST /api/blog/schedule
{
  "lang": "ko",
  "enabled": true,
  "intervalHours": 24,        // 24 | 48 | 72 | 168
  "keywords": ["키워드1", "키워드2", ...],
  "targetAudience": "스타트업 마케터",
  "tone": "전문적이고 실용적인",
  "currentKeywordIndex": 0,
  "lastRunAt": null,
  "nextRunAt": null
}
```

---

## 4. 자동발행 흐름

```
매일 00:00 UTC
  └─ Vercel Cron → GET /api/blog/cron
        └─ ['ko','en','ja'] 순서로 루프
              └─ schedule.enabled && nextRunAt < now
                    └─ POST /api/blog/generate (키워드 순환)
                          └─ PUT /api/blog/posts (Blob에 저장)
                                └─ currentKeywordIndex++ / nextRunAt 업데이트
```

**주의:** `nextRunAt`이 null이면 즉시 실행됩니다. 스케줄 설정 후 최초 1회 실행되므로 의도적으로 활용 가능합니다.

---

## 5. 콘텐츠 현황 확인 방법

포스트 수 확인 (브라우저 또는 fetch):
```
GET https://growweb.me/api/blog/posts?lang=ko
GET https://growweb.me/api/blog/posts?lang=en
GET https://growweb.me/api/blog/posts?lang=ja
```

자동발행 설정 확인:
```
GET https://growweb.me/api/blog/schedule?lang=ko
```

---

## 6. 포스트 데이터 구조

```typescript
interface BlogPost {
  slug: string;              // URL: /blog/ko/{slug}
  lang: 'ko' | 'en' | 'ja';
  title: string;
  metaDescription: string;   // 150-160자, SEO용
  tags: string[];            // 5개
  content: string;           // 마크다운, 최소 2500자
  faq: { q: string; a: string }[];  // FAQ JSON-LD용
  createdAt: string;         // ISO 날짜
  publishedAt?: string;      // 예약 발행일
}
```

---

## 7. 롱테일 키워드 추천 (교체 대상)

현재 키워드 풀에 경쟁이 높은 단어가 많습니다. 아래 방향으로 교체하세요.

**국문 (KO) — 교체 우선순위 높음:**
```
❌ "SEO 최적화 방법"  →  ✅ "스타트업 대표가 직접 하는 SEO 최적화 5단계"
❌ "콘텐츠 마케팅"    →  ✅ "B2B SaaS 콘텐츠 마케팅 월 100만 원으로 시작하기"
❌ "GA4 분석"         →  ✅ "GA4 이탈률 높은 페이지 찾아서 수정하는 법"
```

**영문 (EN):**
```
✅ "how to reduce bounce rate for saas landing pages"
✅ "ga4 custom events setup for small business"
✅ "geo optimization checklist for ai search engines"
```

**일문 (JA):**
```
✅ "スタートアップのSEO対策 費用をかけずに始める方法"
✅ "GA4でバウンス率を下げる具体的な手順"
```

---

## 8. 코드 수정 시 주의사항

- 블로그 포스트는 **Vercel Blob에만 저장**됨 — 로컬 파일시스템에 없음
- 포스트 조회는 항상 `fetch(blobUrl, { cache: 'no-store' })`로
- 인덱스 파일(`posts-index-{lang}.json`)과 개별 포스트 파일 **둘 다** 업데이트해야 함
- admin 권한 체크: `const role = (session?.user as { role?: string })?.role; if (role !== 'admin') return 401`
- AI 생성 시 절대 페르소나 선언 금지 ("저는 시니어 마케터입니다" 등)

---

## 9. 관련 파일 경로

| 파일 | 설명 |
|------|------|
| `components/BlogAdminModule.tsx` | 관리 UI (키워드 풀, 일괄발행, 스케줄 설정) |
| `app/blog/[lang]/page.tsx` | 블로그 목록 페이지 |
| `app/blog/[lang]/[slug]/page.tsx` | 블로그 상세 페이지 (JSON-LD, hreflang) |
| `app/api/blog/generate/route.ts` | AI 생성 프롬프트 (KO/EN/JA 각각) |
| `app/api/blog/schedule/route.ts` | 자동발행 설정 CRUD |
| `app/api/blog/cron/route.ts` | Vercel Cron 핸들러 |
| `app/api/blog/posts/route.ts` | 포스트 CRUD |
| `app/api/admin/cleanup-blog-personas/route.ts` | 기존 포스트 페르소나 문구 일괄 제거 |
| `TODO.md` | 블로그 활성화 체크리스트 |
