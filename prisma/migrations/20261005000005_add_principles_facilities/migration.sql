-- Add teaching_principles table
CREATE TABLE IF NOT EXISTS "teaching_principles" (
  "id"          TEXT NOT NULL,
  "tenantId"    TEXT NOT NULL,
  "number"      TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "teaching_principles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "teaching_principles_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "teaching_principles_tenantId_idx" ON "teaching_principles"("tenantId");

-- Add facilities table
CREATE TABLE IF NOT EXISTS "facilities" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "label"     TEXT NOT NULL,
  "photo"     TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "facilities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "facilities_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "facilities_tenantId_idx" ON "facilities"("tenantId");

-- Add gradeBand to reviews
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "gradeBand" TEXT;
