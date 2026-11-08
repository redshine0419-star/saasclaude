-- 관리자 앱(PWA) 푸시 알림 기기와 '카톡 대신 푸시' 설정. 여러 번 실행해도 안전하다.

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "pushReplacesKakao" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "push_devices" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "label" TEXT,
    CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_devices_endpoint_key" ON "push_devices"("endpoint");

CREATE INDEX IF NOT EXISTS "push_devices_tenantId_idx" ON "push_devices"("tenantId");

DO $$ BEGIN
  ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
