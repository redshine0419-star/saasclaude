-- 운영자(플랫폼 관리자) 앱 알림 기기. 여러 번 실행해도 안전하다.

CREATE TABLE IF NOT EXISTS "operator_push_devices" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "email" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "label" TEXT,
    CONSTRAINT "operator_push_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "operator_push_devices_endpoint_key" ON "operator_push_devices"("endpoint");
