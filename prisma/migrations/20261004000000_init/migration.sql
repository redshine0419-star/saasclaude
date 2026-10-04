-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('warm', 'result', 'bright');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('beta', 'paid', 'ended');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('platform_admin', 'owner', 'staff');

-- CreateEnum
CREATE TYPE "ConsultType" AS ENUM ('level_test', 'phone', 'visit');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'test_booked', 'enrolled', 'not_enrolled');

-- CreateEnum
CREATE TYPE "LeadEventType" AS ENUM ('created', 'status_changed', 'note', 'message_sent', 'call');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('privacy', 'marketing', 'night');

-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('notice', 'recruit', 'exam');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'scheduled', 'published');

-- CreateEnum
CREATE TYPE "ReviewKind" AS ENUM ('review', 'score_case');

-- CreateEnum
CREATE TYPE "MessageScenario" AS ENUM ('receipt', 'reminder', 'followup', 'campaign', 'owner_alert', 'reconfirm');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('info', 'ad');

-- CreateEnum
CREATE TYPE "TemplateReviewStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('alimtalk', 'brand', 'sms_fallback');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'sent', 'failed', 'deferred');

-- CreateEnum
CREATE TYPE "DiagnosticStatus" AS ENUM ('pending', 'in_review', 'done');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'waiting_docs', 'in_progress', 'review', 'ready');

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" "Theme" NOT NULL DEFAULT 'warm',
    "accentColor" TEXT,
    "planStatus" "PlanStatus" NOT NULL DEFAULT 'beta',
    "betaStartedAt" TIMESTAMP(3),
    "betaEndsAt" TIMESTAMP(3),
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "regNo" TEXT,
    "subjects" TEXT,
    "targetGrades" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "hours" TEXT,
    "kakaoChannelUrl" TEXT,
    "naverPlaceUrl" TEXT,
    "ga4MeasurementId" TEXT,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_sections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tenant_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'staff',

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notify_recipients" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "notify_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "director_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "photo" TEXT,
    "headline" TEXT,
    "philosophy" TEXT,
    "education" TEXT,
    "career" TEXT,
    "subjectsTaught" TEXT,

    CONSTRAINT "director_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleLabel" TEXT,
    "photo" TEXT,
    "summary" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeBand" TEXT,
    "days" TEXT[],
    "startTime" TEXT,
    "endTime" TEXT,
    "capacity" INTEGER,
    "seatsLeft" INTEGER,
    "waitlistCount" INTEGER NOT NULL DEFAULT 0,
    "textbook" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_test_slots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "weekday" INTEGER,
    "time" TEXT,
    "date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "level_test_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fees" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT,
    "label" TEXT NOT NULL,
    "sessionsPerWeek" INTEGER,
    "monthlyHours" INTEGER,
    "amount" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra_costs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "extra_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_policy_texts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "refund_policy_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "studentGrade" TEXT,
    "school" TEXT,
    "consultType" "ConsultType" NOT NULL DEFAULT 'level_test',
    "preferredSlotId" TEXT,
    "message" TEXT,
    "source" TEXT,
    "utm" JSONB,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "type" "LeadEventType" NOT NULL,
    "payload" JSONB,
    "actorId" TEXT,

    CONSTRAINT "lead_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "channel" TEXT,
    "reconfirmDueAt" TIMESTAMP(3),

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL DEFAULT 'notice',
    "title" TEXT NOT NULL,
    "summaryFields" JSONB,
    "body" TEXT NOT NULL,
    "images" TEXT[],
    "status" "PostStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "sendKakao" BOOLEAN NOT NULL DEFAULT false,
    "kakaoScheduledAt" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "kind" "ReviewKind" NOT NULL DEFAULT 'review',
    "body" TEXT,
    "authorLabel" TEXT,
    "source" TEXT,
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "consentFile" TEXT,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "periodLabel" TEXT,
    "comment" TEXT,
    "showOnHome" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_stats" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "termLabel" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "basisText" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "result_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scenario" "MessageScenario" NOT NULL,
    "kind" "MessageKind" NOT NULL DEFAULT 'info',
    "body" TEXT NOT NULL,
    "providerTemplateCode" TEXT,
    "reviewStatus" "TemplateReviewStatus" NOT NULL DEFAULT 'draft',
    "approvedBody" TEXT,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scenario" "MessageScenario" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "delayRule" JSONB,

    CONSTRAINT "automation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT,
    "scenario" "MessageScenario" NOT NULL,
    "kind" "MessageKind" NOT NULL,
    "channel" "MessageChannel" NOT NULL DEFAULT 'alimtalk',
    "recipientHash" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'pending',
    "cost" INTEGER,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "aiCheck" JSONB,
    "managerNote" TEXT,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_requests" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "academyName" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "currentUrl" TEXT,
    "status" "DiagnosticStatus" NOT NULL DEFAULT 'pending',
    "resultNote" TEXT,

    CONSTRAINT "diagnostic_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "academyName" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "directorName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "currentUrl" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',
    "queueOrder" INTEGER,
    "expectedStartDate" TIMESTAMP(3),
    "uploadedFiles" TEXT[],
    "wantsPhotoShoot" BOOLEAN NOT NULL DEFAULT false,
    "consentTerms" BOOLEAN NOT NULL DEFAULT false,
    "consentPrivacy" BOOLEAN NOT NULL DEFAULT false,
    "consentBeta" BOOLEAN NOT NULL DEFAULT false,
    "consentCase" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_sections_tenantId_sectionKey_key" ON "tenant_sections"("tenantId", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_tenantId_userId_key" ON "memberships"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "director_profiles_tenantId_key" ON "director_profiles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "refund_policy_texts_tenantId_key" ON "refund_policy_texts"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_tenantId_scenario_key" ON "message_templates"("tenantId", "scenario");

-- CreateIndex
CREATE UNIQUE INDEX "automation_settings_tenantId_scenario_key" ON "automation_settings"("tenantId", "scenario");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_tenantId_month_key" ON "monthly_reports"("tenantId", "month");

-- AddForeignKey
ALTER TABLE "tenant_sections" ADD CONSTRAINT "tenant_sections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notify_recipients" ADD CONSTRAINT "notify_recipients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_profiles" ADD CONSTRAINT "director_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_test_slots" ADD CONSTRAINT "level_test_slots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fees" ADD CONSTRAINT "fees_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_costs" ADD CONSTRAINT "extra_costs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_policy_texts" ADD CONSTRAINT "refund_policy_texts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_preferredSlotId_fkey" FOREIGN KEY ("preferredSlotId") REFERENCES "level_test_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_stats" ADD CONSTRAINT "result_stats_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_settings" ADD CONSTRAINT "automation_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

