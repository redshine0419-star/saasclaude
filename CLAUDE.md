# 첫등원 — Claude Code 작업 규칙

이 파일은 매 세션 시작 시 읽는다. 상세 기능은 `docs/SPEC.md`, 작업 순서는 `docs/TASKS.md`, 디자인 참고 방법은 `docs/DESIGN.md`.

## 현재 운영 정책

베타 기간: 모든 학원 3개월 무료(오픈일 기준), 인원 제한 없음, 자동 결제 없음. 상세는 SPEC 10장.

## 무엇을 만드는가

동네 학원·교습소용 **멀티테넌트 SaaS**. 하나의 코드베이스로 여러 학원의 홈페이지와 관리자를 운영한다.

1. **학원 홈페이지** (학부모용) — `growweb.me/{slug}`, 3가지 테마 중 하나로 보인다.
2. **학원 관리자** (원장용) — `growweb.me/{slug}/admin`, 상담 관리, 카카오톡 자동 발송, 콘텐츠 관리, 월간 리포트.
3. **첫등원 서비스 사이트** (원장 대상 마케팅) — `growweb.me/`, 서비스 소개, 무료 진단, 신청.
4. **플랫폼 관리자** (첫등원 운영자용) — `growweb.me/platform`, 학원 목록, 테마·섹션 설정, 베타 신청·제작 관리.

## URL 구조

```
growweb.me/                   → 첫등원 마케팅 사이트 (F-01~F-06)
growweb.me/{slug}             → 학원 홈페이지 (S-01~S-10)
growweb.me/{slug}/admin       → 학원 관리자 (A-00~A-10)
growweb.me/platform           → 플랫폼 관리자 (P-01~P-05)
```

예약 slug (학원이 사용 불가): `platform`, `admin`, `service`, `pricing`, `apply`, `demo`, `consult`, `api`, `_next`, `static`

## 기술 스택

- **Next.js 16** (App Router) + TypeScript (strict)
- **Tailwind CSS 4** — 테마 색·폰트는 CSS 변수로, Tailwind는 변수를 참조
- **Neon PostgreSQL** — `@neondatabase/serverless` + `@prisma/adapter-neon`
- **Prisma 7** — ORM, 마이그레이션 파일 방식 (`prisma migrate`)
- **NextAuth v5 beta** — Google OAuth, JWT 세션, 4가지 역할 (platform_admin / owner / staff / anon)
- **Vercel Blob** — 이미지·파일 스토리지
- **Vercel** — 배포 (growweb.me 도메인)
- **카카오 알림톡·브랜드 메시지**: 반드시 `lib/messaging/` 어댑터 뒤에 숨겨서 교체 가능하게
- **예약 발송**: Vercel Cron
- **분석**: GA4 (학원별 측정 ID), 전환 이벤트 `generate_lead`

## 절대 원칙

1. **멀티테넌트가 기본이다.** 모든 업무 테이블에 `tenant_id`. Prisma 쿼리는 항상 `where: { tenantId }` 조건 필수. 요청의 URL 경로(`/{slug}`)로 테넌트를 판별한다. 학원 하나 기준으로 하드코딩하지 않는다.
2. **테마는 구조가 아니라 설정이다.** 섹션 컴포넌트는 한 벌만 만든다. 테마는 (a) 디자인 토큰 (b) 켜는 섹션과 순서만 정한다. 테마별로 페이지를 따로 만들지 않는다.
3. **`design/` 폴더는 참고용 시안이다.** 인라인 스타일, `{{ }}`, `dc-import`, `data-props`는 시안 도구 문법이다. 레이아웃·문구·위계·간격 의도를 읽고 우리 컴포넌트로 다시 구현한다.
4. **대괄호 `[ ]` 문구는 실제 데이터 자리다.** 하드코딩하지 말고 DB 필드나 관리자 입력으로 연결한다.
5. **법적 요건은 코드로 강제한다** (SPEC의 "규칙" 섹션). 광고성 메시지 동의 확인, (광고) 표기, 야간 차단, 동의 없는 후기·성적 사례 비공개 등은 UI 안내가 아니라 서버 로직에서 막는다.
6. **개인정보 최소 노출.** 관리자 목록의 연락처는 마스킹, 상세에서만 전체 표시. 로그에 연락처 원문을 남기지 않는다.
7. **모바일 우선.** 학부모 화면은 390px에서 먼저 확인하고 넓힌다. 모바일 하단 고정 바(전화·카톡·신청)는 모든 학부모 페이지에 있다.

## 테넌트 격리 패턴

```ts
// ✅ 항상 이렇게
const leads = await prisma.lead.findMany({
  where: { tenantId: tenant.id, ...filters },
});

// ❌ 절대 이렇게 하지 않는다
const leads = await prisma.lead.findMany({ where: filters });
```

관리자 접근 체크:
```ts
const session = await auth();
if (!session?.user?.email) redirect('/auth/signin');
const membership = await prisma.membership.findFirst({
  where: { tenantId, user: { email: session.user.email } },
});
if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

## 작업 방식

- `docs/TASKS.md`의 Phase 순서를 지킨다. 한 Phase 안에서도 작은 단위로 커밋한다.
- 작업 시작 전 계획을 먼저 보여주고, 사용자가 승인하면 구현한다.
- 화면을 만들 때는 SPEC의 화면 ID(S-01, A-02 등)와 `design/` 파일을 함께 참고한다.
- 외부 API(카카오, GA4) 키가 없으면 목(mock) 어댑터로 구현하고 실제 연동은 환경변수로 전환한다.
- 확실하지 않은 법적·정책적 판단은 구현하지 말고 `TODO(확인 필요)`로 남기고 사용자에게 묻는다.
- DB 스키마 변경은 마이그레이션 파일로만 한다 (`prisma migrate dev`).

## 디자인 토큰 요약

**기준 파일은 `design/design-system/tokens.json`**. 사용 규칙은 `design/design-system/README.md`. 화면 모습은 `design/screenshots/`.
CSS 변수는 `styles/tokens.css`, Tailwind 연결은 `tailwind.config.ts`.

- 테마 A 원장 직강형: 종이색 바탕, 칠판 녹색 강조, 명조 제목 (Gowun Batang + IBM Plex Sans KR)
- 테마 B 성과 중심형: 남색·흰색, 진한 파랑 강조, 굵은 고딕 제목 (Gothic A1 + IBM Plex Sans KR)
- 테마 C 밝은 친근형: 흰 바탕 + 파스텔 카드, 청록 강조, 둥근 제목 (Jua + IBM Plex Sans KR)
- 관리자: 테마와 무관하게 공통 (남색 사이드바, 녹색 주요 버튼)
- 첫등원 서비스 사이트: 남색 + 스쿨버스 노랑, IBM Plex Sans KR
