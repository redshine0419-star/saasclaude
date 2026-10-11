ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "customDomainStatus" TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "customDomainVerifiedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_customDomain_key" ON tenants ("customDomain");
