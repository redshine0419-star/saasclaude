-- 원장 알림함 + 학부모 보낼 문자 할 일 (카톡 발송 대신). 여러 번 실행해도 안전하다.

CREATE TABLE IF NOT EXISTS "admin_notifications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sms_tasks" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refKey" TEXT NOT NULL DEFAULT '',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "doneAt" TIMESTAMP(3),
    "doneBy" TEXT,
    CONSTRAINT "sms_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_notifications_tenantId_createdAt_idx" ON "admin_notifications"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "sms_tasks_tenantId_status_dueAt_idx" ON "sms_tasks"("tenantId", "status", "dueAt");
CREATE UNIQUE INDEX IF NOT EXISTS "sms_tasks_leadId_kind_refKey_key" ON "sms_tasks"("leadId", "kind", "refKey");

DO $$ BEGIN
  ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "sms_tasks" ADD CONSTRAINT "sms_tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "sms_tasks" ADD CONSTRAINT "sms_tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
