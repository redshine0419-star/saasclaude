-- Add gallery value to PostCategory enum
ALTER TYPE "PostCategory" ADD VALUE IF NOT EXISTS 'gallery';

-- Add naverSiteVerification column to tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "naverSiteVerification" TEXT;
