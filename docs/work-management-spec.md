# 업무관리 시스템 구현 명세서

> 다른 Claude 세션에 컨텍스트를 전달하기 위한 문서입니다.

---

## 1. 개요

구글 로그인 기반 SaaS의 업무관리 모듈입니다.  
**프로젝트 → 태스크 → 서브태스크** 3단 계층 구조로 팀 업무를 관리합니다.

- **인증**: NextAuth v5 (Google OAuth)
- **DB**: Neon PostgreSQL + Prisma ORM
- **프론트**: Next.js App Router + React 19 + Tailwind CSS 4
- **인증 방식**: 세션 기반 — 모든 API가 `session.user.email` 검증

---

## 2. DB 스키마

### WorkUser
```prisma
model WorkUser {
  id               String   @id @default(cuid())
  email            String   @unique
  name             String?
  avatarUrl        String?
  jobTitle         String?        // 직함
  responsibilities String?        // 담당 업무
  workStyle        String?        // 업무 스타일
  createdAt        DateTime @default(now())

  projectMembers   ProjectMember[]
  assignedTasks    Task[]          @relation("assignee")
  createdTasks     Task[]          @relation("creator")
  comments         Comment[]
  assignedSubTasks SubTask[]       @relation("subtaskAssignee")
  notifications    Notification[]
}
```
- 로그인 시 `upsert`로 자동 생성 (email 기준)
- 초대는 이미 한 번이라도 로그인한 사람만 가능

### Project
```prisma
model Project {
  id          String    @id @default(cuid())
  name        String
  description String?
  color       String    @default("#6366f1")   // HEX 색상
  status      String    @default("active")    // active | archived
  startDate   DateTime?
  dueDate     DateTime?
  isOngoing   Boolean   @default(false)       // 상시 운영 프로젝트
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  members ProjectMember[]
  tasks   Task[]
}
```

### ProjectMember
```prisma
model ProjectMember {
  id        String @id @default(cuid())
  role      String @default("member")   // owner | admin | member
  userId    String
  projectId String

  @@unique([userId, projectId])   // 중복 멤버 방지
}
```
- 프로젝트 생성자는 자동으로 `owner` 역할 부여

### Task (핵심 모델)
```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      String    @default("기획")     // 칸반 컬럼 id (커스텀 가능)
  priority    String    @default("보통")     // 낮음 | 보통 | 높음 | 긴급
  startDate   DateTime?
  dueDate     DateTime?
  position    Float     @default(0)          // 컬럼 내 순서 (드래그앤드롭)
  isKeyTask   Boolean   @default(false)      // 핵심 태스크 여부 (별표)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // 운영 현황 확장 필드
  category     String @default("")   // 업무 카테고리 (커스터마이즈 가능)
  taskType     String @default("")   // 태스크 종류 (커스터마이즈 가능)
  requester    String @default("")   // 요청자
  externalLink String @default("")   // 외부 링크

  // 4단계 파이프라인 (각 단계별 상태 + 시작일/목표일)
  planningStatus    String    @default("미시작")
  planningStartDate DateTime?
  planningDueDate   DateTime?
  designStatus      String    @default("미시작")
  designStartDate   DateTime?
  designDueDate     DateTime?
  publishStatus     String    @default("미시작")
  publishStartDate  DateTime?
  publishDueDate    DateTime?
  devStatus         String    @default("미시작")
  devStartDate      DateTime?
  devDueDate        DateTime?

  projectId  String
  assigneeId String?
  creatorId  String?

  labels   TaskLabel[]
  comments Comment[]
  subTasks SubTask[]
}
```

**단계별 상태값**: `미시작 | 진행중 | 검토요청 | 피드백 | 보류 | 완료 | N/A`

### SubTask
```prisma
model SubTask {
  id        String    @id @default(cuid())
  title     String
  startDate DateTime?
  dueDate   DateTime?
  status    String    @default("미시작")
  createdAt DateTime  @default(now())

  taskId     String
  assigneeId String?
}
```

### Label / TaskLabel
```prisma
model Label {
  id    String @id @default(cuid())
  name  String
  color String @default("#94a3b8")
}

model TaskLabel {
  taskId  String
  labelId String
  @@id([taskId, labelId])
}
```

### Comment
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  taskId    String
  userId    String
}
```

### Notification
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  body      String
  type      String   @default("ai-pm")
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

---

## 3. API 엔드포인트

모든 API는 `session.user.email` 없으면 401 반환.  
`WorkUser`는 로그인할 때마다 `upsert` 처리.

### `/api/work/projects`
| 메서드 | 기능 | 비고 |
|--------|------|------|
| GET | 내가 멤버인 프로젝트 목록 | `_count.tasks`, `_count.members` 포함 |
| POST | 프로젝트 생성 | 생성자 자동 owner 등록 |
| PATCH | 프로젝트 수정 | `name, description, color, status, startDate, dueDate, isOngoing` |
| DELETE | 프로젝트 삭제 | 관련 태스크 cascade delete |

### `/api/work/tasks`
| 메서드 | 기능 | 비고 |
|--------|------|------|
| GET | 태스크 목록 | `?projectId=`, `?assignedToMe=true`, `?memberId=` |
| POST | 태스크 생성 | `projectId`, `title` 필수 |
| PUT | 태스크 전체 수정 | 허용 필드 화이트리스트 적용 |
| DELETE | 태스크 삭제 | `?id=` |

**GET 응답에 포함되는 정보**: `assignee`, `labels(+label)`, `subTasks(+assignee)`, `_count.comments`, `project`

### `/api/work/members`
| 메서드 | 기능 | 비고 |
|--------|------|------|
| GET | 프로젝트 멤버 목록 | `?projectId=` 필수. user 상세(jobTitle 등) 포함 |
| POST | 멤버 초대 | email로 찾음. 미로그인 사용자 초대 불가 |
| PATCH | 프로필 수정 | `jobTitle, responsibilities, workStyle` |
| DELETE | 멤버 제거 | `?userId=&projectId=` |

### `/api/work/subtasks`
| 메서드 | 기능 | 비고 |
|--------|------|------|
| GET | 서브태스크 목록 | `?taskId=` 또는 `?assignedToMe=true` 또는 `?memberId=` |
| POST | 서브태스크 생성 | `taskId`, `title` 필수 |
| PUT | 서브태스크 수정 | `title, status, startDate, dueDate, assigneeId` |
| DELETE | 서브태스크 삭제 | `?id=` |

### `/api/work/ai-pm`
- POST: AI PM 주간 보고 생성 (Gemini 기반). 팀원 프로필 + 태스크 현황 → Slack 전송

### `/api/work/excel`
- GET: 전체 태스크 Excel 내보내기 (`xlsx` 라이브러리)

### `/api/work/import-ops`
- POST: Excel 파일에서 운영 데이터 가져오기

---

## 4. 프론트엔드 컴포넌트 구조

### WorkKanbanTab.tsx (메인, 약 82KB)
칸반보드의 핵심 컴포넌트. 3가지 뷰모드 지원.

**뷰 모드:**
- `card`: 기본 칸반 보드 (드래그앤드롭)
- `gantt`: 간트 차트 (날짜 기반 시각화)
- `ops`: 목록/스프레드시트 뷰 (열 커스터마이즈)

**드래그앤드롭 구현:**
- HTML5 네이티브 drag API (`draggable`, `onDragStart`, `onDragOver`, `onDrop`)
- 드롭 시 `status` 업데이트 → PUT `/api/work/tasks`

**컬럼(Stage) 관리:**
- `localStorage`에 저장 (`work-stages-${projectId}` 키)
- 기본값: `기획 | 디자인 | 퍼블 | 개발 | 완료`
- 컬럼 추가/삭제/색상 변경/순서 변경 가능
- 설정 모달(`SettingsModal`)에서 카테고리, 태스크종류도 커스터마이즈

**태스크 상세 모달(`TaskDetailModal`)에서 지원하는 기능:**
- 제목/설명 인라인 편집
- 담당자 변경 (프로젝트 멤버 목록에서 선택)
- 우선순위 (낮음/보통/높음/긴급) — 색상 코딩
- 핵심 태스크 토글 (별표 ⭐)
- 라벨 추가/제거
- 시작일/마감일 설정
- 4단계 파이프라인 상태/날짜 (기획/디자인/퍼블/개발 각각)
- 서브태스크 추가/완료/삭제/담당자/날짜 설정
- 댓글 작성/수정/삭제 (내가 쓴 댓글만 수정/삭제)
- 외부 링크 첨부
- 태스크 삭제

**기타 기능:**
- 태스크 필터 (담당자별, 우선순위별, 핵심태스크만)
- 태스크 정렬 (마감일순, 우선순위순, 생성순)
- 멤버별 태스크 보기 (우측 멤버 패널)
- Excel 내보내기 버튼
- Excel 가져오기 버튼

### WorkProjectsTab.tsx
- 프로젝트 목록 (카드 형태)
- 프로젝트 생성/수정/삭제
- 색상 선택, 기간 설정, 상시운영 여부
- 클릭 시 해당 프로젝트 칸반으로 이동

### WorkMyTasksTab.tsx
- 내 담당 태스크 + 내 담당 서브태스크 통합 조회
- 프로젝트별 그룹핑
- 상태 변경 인라인 처리
- 핵심 태스크 필터

### WorkTeamTab.tsx
- 프로젝트별 멤버 목록
- 멤버 초대 (이메일 입력 → 기존 가입자만 초대 가능)
- 역할 표시 (owner/admin/member 아이콘)
- 프로필 편집 (직함, 담당업무, 업무스타일)
- AI PM 실행 버튼 (Slack 연동)

---

## 5. 주요 설계 결정 사항

### WorkUser 자동 생성
```ts
// 모든 API에서 공통 패턴
async function getWorkUser(email, name, image) {
  return prisma.workUser.upsert({
    where: { email },
    update: { name, avatarUrl: image },
    create: { email, name, avatarUrl: image },
  });
}
```

### 멤버 초대 제약
이미 서비스에 로그인한 사람(WorkUser 존재)만 초대 가능. 미가입자는 초대 불가.

### 칸반 컬럼 커스터마이즈
컬럼 정보는 DB가 아닌 **localStorage**에 저장. 프로젝트별로 분리된 키 사용.
→ 장점: DB 부하 없음 / 단점: 브라우저별 다름, 팀 공유 불가

### 4단계 파이프라인 (기획→디자인→퍼블→개발)
각 단계별 `status` + `startDate` + `dueDate` 필드를 Task에 직접 포함.
→ 별도 테이블 없이 단일 Task 모델로 처리

### position 필드
컬럼 내 순서 관리용 `Float`. 드래그앤드롭 시 앞뒤 position 평균값 계산 방식이 아닌, 단순 순서 업데이트 방식 사용.

### 태스크 허용 필드 화이트리스트
```ts
const ALLOWED = [
  'title', 'description', 'status', 'priority', 'startDate', 'dueDate', 
  'assigneeId', 'position', 'isKeyTask', 'category', 'taskType', 
  'requester', 'externalLink',
  'planningStatus', 'planningStartDate', 'planningDueDate',
  'designStatus', 'designStartDate', 'designDueDate',
  'publishStatus', 'publishStartDate', 'publishDueDate',
  'devStatus', 'devStartDate', 'devDueDate',
];
```

---

## 6. 상수 값 정리

### 기본 칸반 컬럼 (수정 가능)
```
기획 (#8b5cf6) → 디자인 (#0969da) → 퍼블 (#f97316) → 개발 (#14b8a6) → 완료 (#1a7f37)
```

### 단계별 상태
```
미시작 | 진행중 | 검토요청 | 피드백 | 보류 | 완료 | N/A
```

### 우선순위
```
낮음 (#94a3b8) | 보통 (#eab308) | 높음 (#f97316) | 긴급 (#ef4444)
```

### 역할
```
owner (소유자) | admin (관리자) | member (멤버)
```

### 기본 카테고리 (수정 가능, localStorage 저장)
```
어학연수 | 해외대학 | 조기유학/캠프 | 아트포폴 | 견적시스템 | 기타
```

### 기본 태스크 종류 (수정 가능, localStorage 저장)
```
기능개선 | 프로그램_신규 | 프로그램_수정 | 오류 | 기타 유지보수 | 검토요청 | 프로젝트
```

---

## 7. 미구현 / 알려진 한계

- 칸반 컬럼 설정이 localStorage 저장이라 팀원 간 공유 안 됨
- 멤버 초대 시 이메일 알림 없음 (직접 알려줘야 함)
- 역할(owner/admin/member)에 따른 권한 분기 없음 (현재 모두 동일 권한)
- 파일 첨부 미구현 (externalLink 텍스트 필드만 있음)
- 실시간 업데이트 없음 (폴링/웹소켓 미구현)
