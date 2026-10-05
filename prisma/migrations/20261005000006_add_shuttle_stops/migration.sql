-- CreateTable
CREATE TABLE "shuttle_stops" (
    "id"         TEXT NOT NULL,
    "tenant_id"  TEXT NOT NULL,
    "stop"       TEXT NOT NULL,
    "pickup"     TEXT,
    "dropoff"    TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shuttle_stops_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "shuttle_stops" ADD CONSTRAINT "shuttle_stops_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
