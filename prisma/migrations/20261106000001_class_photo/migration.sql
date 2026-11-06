-- 반(수업) 사진 — 홈페이지 반 카드에 쓴다. 여러 번 실행해도 안전하다.

ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "photo" TEXT;
