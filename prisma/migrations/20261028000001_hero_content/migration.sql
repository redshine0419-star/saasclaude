-- 메인 히어로 문구·대표 사진 (원장 편집). 모든 문장은 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "heroBadge" TEXT;

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "heroTitle" TEXT;

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT;

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "heroPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[];
