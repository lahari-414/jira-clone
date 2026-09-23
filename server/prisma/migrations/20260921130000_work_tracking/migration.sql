-- Lifecycle fields preserve existing issue data while enabling a complete audit trail.
ALTER TYPE "IssueStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';
ALTER TYPE "IssueStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "IssuePriority" ADD VALUE IF NOT EXISTS 'CRITICAL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ISSUE_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PRIORITY_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SPRINT_UPDATED';

-- BACKLOG used to be a separate workflow state. It is now the automatic TODO view.
UPDATE "Issue" SET "status" = 'TODO' WHERE "status" = 'BACKLOG';
ALTER TABLE "Issue" ALTER COLUMN "status" SET DEFAULT 'TODO';

ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "assignedById" TEXT;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "completedById" TEXT;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3);
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP(3);
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Issue_assignedById_idx" ON "Issue"("assignedById");
CREATE INDEX IF NOT EXISTS "Issue_completedById_idx" ON "Issue"("completedById");

CREATE TABLE IF NOT EXISTS "IssueSprint" (
  "issueId" TEXT NOT NULL,
  "sprintId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IssueSprint_pkey" PRIMARY KEY ("issueId", "sprintId"),
  CONSTRAINT "IssueSprint_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "IssueSprint_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "IssueSprint_sprintId_idx" ON "IssueSprint"("sprintId");
INSERT INTO "IssueSprint" ("issueId", "sprintId") SELECT "id", "sprintId" FROM "Issue" WHERE "sprintId" IS NOT NULL ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS "EmailNotification" (
  "id" TEXT NOT NULL, "issueId" TEXT NOT NULL, "userId" TEXT, "event" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL, "subject" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMP(3), "error" TEXT, "eventKey" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailNotification_eventKey_key" UNIQUE ("eventKey"),
  CONSTRAINT "EmailNotification_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EmailNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "EmailNotification_issueId_createdAt_idx" ON "EmailNotification"("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailNotification_recipientEmail_idx" ON "EmailNotification"("recipientEmail");
