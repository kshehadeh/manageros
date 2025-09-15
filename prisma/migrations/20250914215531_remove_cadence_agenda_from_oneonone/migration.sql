/*
  Warnings:

  - You are about to drop the column `agenda` on the `OneOnOne` table. All the data in the column will be lost.
  - You are about to drop the column `cadence` on the `OneOnOne` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OneOnOne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "scheduledAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "OneOnOne_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OneOnOne_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OneOnOne" ("id", "managerId", "notes", "reportId", "scheduledAt") SELECT "id", "managerId", "notes", "reportId", "scheduledAt" FROM "OneOnOne";
DROP TABLE "OneOnOne";
ALTER TABLE "new_OneOnOne" RENAME TO "OneOnOne";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
