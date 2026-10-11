CREATE TABLE IF NOT EXISTS ai_draft_logs (
  "id"           TEXT         NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId"     TEXT         NOT NULL,
  "kind"         TEXT         NOT NULL,
  "inputTokens"  INTEGER      NOT NULL DEFAULT 0,
  "outputTokens" INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT "ai_draft_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_draft_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES tenants("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ai_draft_logs_tenantId_createdAt_idx" ON ai_draft_logs ("tenantId", "createdAt");
