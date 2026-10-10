-- Self-serve onboarding + site configuration history
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "onboardedVia"   TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "signupConsents" JSONB;

CREATE TABLE IF NOT EXISTS site_versions (
  "id"         TEXT         NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId"   TEXT         NOT NULL,
  "actorEmail" TEXT         NOT NULL,
  "reason"     TEXT         NOT NULL,
  "snapshot"   JSONB        NOT NULL,
  CONSTRAINT "site_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "site_versions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES tenants("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "site_versions_tenantId_createdAt_idx" ON site_versions ("tenantId", "createdAt");
