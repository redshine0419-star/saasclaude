-- 학원 자료실. 여러 번 실행해도 안전하다.

CREATE TABLE IF NOT EXISTS "resources" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "files" JSONB NOT NULL DEFAULT '[]',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "shareToken" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "authorEmail" TEXT NOT NULL,
    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "resources_shareToken_key" ON "resources"("shareToken");

CREATE INDEX IF NOT EXISTS "resources_tenantId_createdAt_idx" ON "resources"("tenantId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "resources" ADD CONSTRAINT "resources_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
