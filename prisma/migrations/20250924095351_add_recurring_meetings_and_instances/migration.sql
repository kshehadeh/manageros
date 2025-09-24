-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceType" TEXT;

-- CreateTable
CREATE TABLE "MeetingInstance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingInstanceParticipant" (
    "id" TEXT NOT NULL,
    "meetingInstanceId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingInstanceParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingInstance_meetingId_idx" ON "MeetingInstance"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingInstance_organizationId_idx" ON "MeetingInstance"("organizationId");

-- CreateIndex
CREATE INDEX "MeetingInstance_scheduledAt_idx" ON "MeetingInstance"("scheduledAt");

-- CreateIndex
CREATE INDEX "MeetingInstanceParticipant_meetingInstanceId_idx" ON "MeetingInstanceParticipant"("meetingInstanceId");

-- CreateIndex
CREATE INDEX "MeetingInstanceParticipant_personId_idx" ON "MeetingInstanceParticipant"("personId");

-- CreateIndex
CREATE INDEX "MeetingInstanceParticipant_status_idx" ON "MeetingInstanceParticipant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingInstanceParticipant_meetingInstanceId_personId_key" ON "MeetingInstanceParticipant"("meetingInstanceId", "personId");

-- CreateIndex
CREATE INDEX "Meeting_isRecurring_idx" ON "Meeting"("isRecurring");

-- AddForeignKey
ALTER TABLE "MeetingInstance" ADD CONSTRAINT "MeetingInstance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInstance" ADD CONSTRAINT "MeetingInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInstanceParticipant" ADD CONSTRAINT "MeetingInstanceParticipant_meetingInstanceId_fkey" FOREIGN KEY ("meetingInstanceId") REFERENCES "MeetingInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingInstanceParticipant" ADD CONSTRAINT "MeetingInstanceParticipant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
