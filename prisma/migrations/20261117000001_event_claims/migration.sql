-- 무료 기간 이벤트 신청 (개선 제안 1개월 · 블로그 소개글 3개월). 여러 번 실행해도 안전하다.
CREATE TABLE IF NOT EXISTS "event_claims" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "months" INTEGER NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "disclosureAgreedAt" TIMESTAMP(3),
    "submittedBy" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectReason" TEXT,
    "appliedTo" TEXT,
    "freeUntil" TIMESTAMP(3),
    CONSTRAINT "event_claims_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "event_claims_tenantId_kind_idx" ON "event_claims"("tenantId", "kind");
CREATE INDEX IF NOT EXISTS "event_claims_status_createdAt_idx" ON "event_claims"("status", "createdAt");
DO $$ BEGIN
  ALTER TABLE "event_claims" ADD CONSTRAINT "event_claims_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
