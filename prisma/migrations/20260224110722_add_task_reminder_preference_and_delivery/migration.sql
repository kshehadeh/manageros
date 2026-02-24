-- CreateEnum
CREATE TYPE "TaskReminderDeliveryStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'SNOOZED');

-- CreateTable
CREATE TABLE "TaskReminderPreference" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderMinutesBeforeDue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskReminderPreference_pkey" PRIMARY KEY ("taskId","userId")
);

-- CreateTable
CREATE TABLE "TaskReminderDelivery" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskDueDate" TIMESTAMP(3) NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "status" "TaskReminderDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskReminderDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskReminderPreference_userId_idx" ON "TaskReminderPreference"("userId");

-- CreateIndex
CREATE INDEX "TaskReminderDelivery_userId_status_idx" ON "TaskReminderDelivery"("userId", "status");

-- CreateIndex
CREATE INDEX "TaskReminderDelivery_remindAt_status_idx" ON "TaskReminderDelivery"("remindAt", "status");

-- AddForeignKey
ALTER TABLE "TaskReminderPreference" ADD CONSTRAINT "TaskReminderPreference_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReminderPreference" ADD CONSTRAINT "TaskReminderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReminderDelivery" ADD CONSTRAINT "TaskReminderDelivery_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReminderDelivery" ADD CONSTRAINT "TaskReminderDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
