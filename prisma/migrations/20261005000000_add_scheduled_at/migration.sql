-- Add scheduledAt to messages for deferred night-blocked messages
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);

-- Add kakaoSentAt to posts to track dispatch completion
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "kakao_sent_at" TIMESTAMP(3);
