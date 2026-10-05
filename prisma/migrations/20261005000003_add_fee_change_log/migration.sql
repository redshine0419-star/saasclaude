-- CreateTable: fee_change_logs
CREATE TABLE "fee_change_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "fee_change_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fee_change_logs" ADD CONSTRAINT "fee_change_logs_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "fee_change_logs_tenantId_idx" ON "fee_change_logs"("tenantId");
