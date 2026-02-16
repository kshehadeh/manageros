/*
  Warnings:

  - You are about to drop the column `notificationId` on the `Exception` table. All the data in the column will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey (NotificationResponse must be dropped before Notification)
ALTER TABLE "NotificationResponse" DROP CONSTRAINT "NotificationResponse_notificationId_fkey";

ALTER TABLE "NotificationResponse" DROP CONSTRAINT "NotificationResponse_userId_fkey";

-- DropTable (drop NotificationResponse first - it references Notification)
DROP TABLE "NotificationResponse";

-- DropForeignKey (Exception references Notification)
ALTER TABLE "Exception" DROP CONSTRAINT "Exception_notificationId_fkey";

-- DropIndex
DROP INDEX "Exception_notificationId_idx";

DROP INDEX "Exception_notificationId_key";

-- AlterTable
ALTER TABLE "Exception" DROP COLUMN "notificationId";

-- DropForeignKey (Notification references)
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_organizationId_fkey";

ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropTable
DROP TABLE "Notification";
