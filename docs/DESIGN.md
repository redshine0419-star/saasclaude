# 디자인 참고 가이드 (DESIGN)

디자인은 세 가지 형태로 들어 있다. 용도가 다르니 같이 쓴다.

| 폴더 | 무엇 | 언제 보나 |
|---|---|---|
| `design/screenshots/` | 모든 화면의 PNG | **실제 모습 확인**. 구현 전에 보고, 구현 후 비교 |
| `design/academy/`, `design/marketing/` | 시안 원본 HTML (`*.dc.html`) | 정확한 문구·간격·구조 확인 |
| `design/design-system/` | 토큰(`tokens.json`), 사용 규칙(`README.md`), 컴포넌트 규칙 | **색·글꼴·간격 값의 기준**. 값은 여기서만 가져온다 |

## 1. 스크린샷 (화면 ID 기준)

`design/screenshots/academy/`
- `00-sitemap.png` — 메뉴 구조도
- `S-01` ~ `S-10` — 학원 홈페이지 (테마 A 기준, 데스크톱 1440px)
- `M-01` ~ `M-10`, `M-NAV` — 학원 홈페이지 모바일 전체 (390px, 2배 해상도)
- `P-01` ~ `P-05` — 플랫폼 관리자 (첫등원 운영자용)
- `A-00` ~ `A-10`, `A-M` — 학원 관리자
- `T-A`, `T-B`, `T-C` (+ `-mobile`) — 테마 3종 홈 비교

`design/screenshots/marketing/`
- `F-01` ~ `F-06a` — 첫등원 서비스 사이트. 각 화면마다 `-desktop`(1440px)과 `-mobile`(390px) 두 장. 이 사이트는 반응형이라 모바일 캡처가 곧 모바일 시안이다.

모바일 이미지는 2배 해상도(780px 폭)로 저장했다. 학원 템플릿 모바일 시안은 테마 A 기준이며, 테마 B·C 모바일은 첫 화면(`T-B-result-mobile`, `T-C-bright-mobile`)만 있다 — 나머지 페이지는 같은 구조에 테마 토큰만 바꿔 적용한다.

## 2. 시안 HTML 열어 보기

시안은 같이 들어 있는 `support.js`(시안 도구 런타임)가 있어야 제대로 보인다. 파일을 더블클릭하지 말고 폴더를 서버로 연다.

```bash
cd design && python3 -m http.server 8000
# 브라우저에서 http://localhost:8000/academy/Main.dc.html
```

`support.js`는 보기 전용이다. 프로젝트 코드에서 import하지 않는다.

## 3. 시안 HTML을 코드로 읽는 법

| 시안 문법 | 의미 | 구현할 때 |
|---|---|---|
| `{{accent}}`, `{{c.about}}` 등 | 시안 도구 변수 | 테마 토큰 / 상태 값 |
| `<dc-import name="SiteHeader" active="about">` | 다른 시안 파일을 컴포넌트로 포함 | 우리 공통 컴포넌트 + props |
| `<script type="text/x-dc" data-props=...>` | 시안 도구 설정 | 무시 |
| `<helmet>` | 폰트·기본 스타일 | 폰트 목록만 참고 |
| 인라인 `style="..."` | 간격·크기·색 의도 | 복사하지 말고 토큰으로 옮긴다 |
| `[대괄호 문구]` | 실제 데이터 자리 | DB 필드로 연결 |
| 관리자 화면의 숫자 (24건, 86건 등) | 예시 | 실제 쿼리로 계산 |

## 4. 디자인 토큰 → 코드

- `design/design-system/tokens.json`의 `color.themes`가 4개다: `fd`(첫등원 서비스), `warm`(테마 A), `result`(테마 B), `bright`(테마 C).
- 같은 이름의 토큰(`bg`, `surface`, `ink`, `body`, `muted`, `accent`, `accent-soft`, `highlight` …)이 테마마다 다른 값을 가진다. CSS 변수로 만들어 `[data-theme="warm"]` 같은 선택자 아래 값을 바꾸고, Tailwind는 `var(--accent)` 같은 변수를 참조하게 설정한다.
- `admin-*`, `status-*`, `brand-*` 토큰은 테마와 무관한 고정값이다.
- 글꼴: `sans` IBM Plex Sans KR, `serif` Gowun Batang(테마 A 제목), `grotesk` Gothic A1(테마 B 제목·숫자), `round` Jua(테마 C 제목). 모두 Google Fonts 또는 `@fontsource/*` npm 패키지로 불러온다.
- 원장이 바꿀 수 있는 건 `accent` 하나. 흰 글자 대비 4.5:1 미만이면 저장 거부.

## 5. 구현 후 비교

Claude Code에게 개발 서버를 Playwright로 390px·1440px 캡처하게 하고, 같은 화면 ID의 스크린샷과 나란히 비교하게 한다. 다르게 구현해야 하는 이유가 있으면 그 이유를 남기게 한다.
