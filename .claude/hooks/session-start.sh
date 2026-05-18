#!/bin/bash
set -euo pipefail

# ── 1. npm 의존성 설치 ─────────────────────────────────────────
if [ -f "$CLAUDE_PROJECT_DIR/package.json" ]; then
  cd "$CLAUDE_PROJECT_DIR"
  npm install --prefer-offline 2>&1 | tail -3
fi

# ── 2. Git 브랜치 상태 검사 ────────────────────────────────────
cd "$CLAUDE_PROJECT_DIR"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo 0)
WARNINGS=()

# main 브랜치에서 커밋 수가 너무 적으면 경고
if [ "$CURRENT_BRANCH" = "main" ] && [ "$COMMIT_COUNT" -lt 100 ]; then
  WARNINGS+=("⚠️  main 브랜치 커밋 수가 ${COMMIT_COUNT}개입니다 (정상: 120개 이상). 히스토리가 손실되었을 수 있습니다.")
fi

# 핵심 파일/디렉토리 존재 확인
REQUIRED=(
  "app/blog"
  "app/work"
  "app/auth"
  "auth.ts"
  "prisma/schema.prisma"
  "components/BlogAdminModule.tsx"
  "components/GA4Module.tsx"
  "middleware.ts"
)
MISSING=()
for path in "${REQUIRED[@]}"; do
  if [ ! -e "$CLAUDE_PROJECT_DIR/$path" ]; then
    MISSING+=("$path")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  WARNINGS+=("⚠️  핵심 파일이 누락되었습니다: ${MISSING[*]}")
  WARNINGS+=("   → 현재 브랜치(${CURRENT_BRANCH})가 불완전할 수 있습니다. 작업 전 사용자에게 브랜치 상태를 보고하세요.")
fi

# 경고 출력
if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🚨 [SessionStart] Git 브랜치 이상 감지"
  for w in "${WARNINGS[@]}"; do
    echo "   $w"
  done
  echo "   → 절대 force-push / reset / orphan 브랜치 생성 금지"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
else
  echo "✅ [SessionStart] 브랜치(${CURRENT_BRANCH}) 정상 — 커밋 ${COMMIT_COUNT}개, 핵심 파일 모두 존재"
fi
