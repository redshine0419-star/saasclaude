CREATE TABLE "member_invites" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "role"      "MemberRole" NOT NULL DEFAULT 'staff',
  "token"     TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "member_invites_token_key" ON "member_invites"("token");
CREATE UNIQUE INDEX "member_invites_tenantId_email_key" ON "member_invites"("tenantId", "email");

ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
