-- 홈페이지 공개 여부(원장)와 학원 삭제 요청. 자동 삭제는 하지 않는다. 여러 번 실행해도 안전하다.

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "unpublishedAt" TIMESTAMP(3);

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3);

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deletionRequestedBy" TEXT;

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;
