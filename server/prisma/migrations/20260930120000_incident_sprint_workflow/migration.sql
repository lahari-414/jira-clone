ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
CREATE TYPE "IncidentStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

CREATE TABLE "Incident" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "IncidentStatus" NOT NULL DEFAULT 'TODO',
  "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Incident_projectId_status_idx" ON "Incident"("projectId", "status");
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Sprint" ADD COLUMN "incidentId" TEXT;
CREATE INDEX "Sprint_incidentId_idx" ON "Sprint"("incidentId");
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

