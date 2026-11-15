-- 요청 횟수 제한 + 개인정보 접속 기록. 여러 번 실행해도 안전하다.
CREATE TABLE IF NOT EXISTS "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "rate_limits_expiresAt_idx" ON "rate_limits"("expiresAt");

CREATE TABLE IF NOT EXISTS "access_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "ipHash" TEXT,
    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "access_logs_tenantId_createdAt_idx" ON "access_logs"("tenantId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
