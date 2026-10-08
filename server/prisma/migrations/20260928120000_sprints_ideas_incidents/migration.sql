ALTER TYPE "SprintStatus" RENAME VALUE 'PLANNED' TO 'FUTURE';
ALTER TYPE "IssueType" ADD VALUE 'INCIDENT';

DELETE FROM "IssueSprint" link
USING "Issue" issue
WHERE link."issueId" = issue.id
  AND (issue."sprintId" IS NULL OR link."sprintId" <> issue."sprintId");

CREATE UNIQUE INDEX "IssueSprint_issueId_key" ON "IssueSprint"("issueId");

CREATE TABLE "Idea" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Idea_createdAt_idx" ON "Idea"("createdAt");
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IdeaComment" (
  "id" TEXT NOT NULL,
  "ideaId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdeaComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IdeaComment_ideaId_createdAt_idx" ON "IdeaComment"("ideaId", "createdAt");
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SprintActivity" (
  "id" TEXT NOT NULL,
  "sprintId" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SprintActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SprintActivity_sprintId_createdAt_idx" ON "SprintActivity"("sprintId", "createdAt");
ALTER TABLE "SprintActivity" ADD CONSTRAINT "SprintActivity_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SprintActivity" ADD CONSTRAINT "SprintActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
