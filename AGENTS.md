<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git 브랜치 규칙 — 반드시 준수

## main 브랜치 보호
- `main` 브랜치에 **절대** force-push, reset, rebase하지 마세요.
- `git checkout --orphan`, `git reset --hard`, `git push --force`는 명시적 사용자 승인 없이 금지입니다.
- `main`은 항상 123개 이상의 커밋 히스토리를 가집니다. 커밋 수가 갑자기 줄어들면 뭔가 잘못된 것입니다.

## 작업 브랜치 규칙
- 새 작업은 반드시 `main`에서 분기한 feature 브랜치에서 진행하세요.
- 작업 완료 후 `main`에 머지할 때는 PR 또는 `git merge`(fast-forward)를 사용하세요.
- **두 브랜치 간 공통 조상(merge-base)이 없으면** 머지하지 말고 사용자에게 먼저 보고하세요.

## 세션 시작 시 체크
- 세션 시작 시 `git log --oneline main | wc -l`로 커밋 수를 확인하세요.
- `app/blog/`, `app/work/`, `app/auth/`, `auth.ts`, `prisma/schema.prisma`가 모두 존재하는지 확인하세요.
- 위 파일이 없으면 **작업을 중단**하고 사용자에게 브랜치 상태를 먼저 보고하세요.
