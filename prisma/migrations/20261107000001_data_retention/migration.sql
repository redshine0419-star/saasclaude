-- 학원 데이터 파기(비공개 전환 후 30일)와 결제 기록 5년 보관. 모든 문장은 여러 번 실행해도 안전하다.
-- scripts/migrate-baseline.mjs 가 이 파일을 빈 줄 단위로 나눠 실행하므로, 문장 안에 빈 줄을 넣지 않는다.

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "inactiveAt" TIMESTAMP(3);

-- 이미 비공개인 학원은 이 마이그레이션 시각부터 30일을 센다 (바로 지워지지 않게)
UPDATE "tenants" SET "inactiveAt" = CURRENT_TIMESTAMP WHERE "status" = 'inactive' AND "inactiveAt" IS NULL;

CREATE TABLE IF NOT EXISTS "payment_archives" (
    "id" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleteAfter" TIMESTAMP(3) NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantSlug" TEXT NOT NULL,
    "regNo" TEXT,
    "orderId" TEXT NOT NULL,
    "tierKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_archives_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_archives_orderId_key" ON "payment_archives"("orderId");

CREATE INDEX IF NOT EXISTS "payment_archives_deleteAfter_idx" ON "payment_archives"("deleteAfter");
