-- CreateTable
CREATE TABLE "tenant_contact_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "tenant_contact_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_access_logs" (
    "id" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,

    CONSTRAINT "proxy_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_contact_logs_tenantId_idx" ON "tenant_contact_logs"("tenantId");

-- CreateIndex
CREATE INDEX "proxy_access_logs_tenantId_idx" ON "proxy_access_logs"("tenantId");

-- CreateIndex
CREATE INDEX "proxy_access_logs_adminEmail_idx" ON "proxy_access_logs"("adminEmail");

-- AddForeignKey
ALTER TABLE "tenant_contact_logs" ADD CONSTRAINT "tenant_contact_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proxy_access_logs" ADD CONSTRAINT "proxy_access_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
