-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "teamId" TEXT,
    "managerId" TEXT,
    "startedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Person_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "outcome" TEXT,
    "startDate" DATETIME,
    "targetDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "rag" TEXT NOT NULL DEFAULT 'green',
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Initiative_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InitiativeOwner" (
    "initiativeId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',

    PRIMARY KEY ("initiativeId", "personId"),
    CONSTRAINT "InitiativeOwner_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InitiativeOwner_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keyResult" TEXT,
    "sortIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Objective_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectiveId" TEXT,
    "initiativeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "estimate" INTEGER,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Task_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "weekOf" DATETIME NOT NULL,
    "rag" TEXT NOT NULL DEFAULT 'green',
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "summary" TEXT NOT NULL,
    "blockers" TEXT,
    "nextSteps" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OneOnOne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "scheduledAt" DATETIME,
    "cadence" TEXT,
    "agenda" TEXT,
    "notes" TEXT,
    CONSTRAINT "OneOnOne_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OneOnOne_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IDP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IDP_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IDPGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idpId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metric" TEXT,
    "target" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "dueDate" DATETIME,
    CONSTRAINT "IDPGoal_idpId_fkey" FOREIGN KEY ("idpId") REFERENCES "IDP" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aboutId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'note',
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_aboutId_fkey" FOREIGN KEY ("aboutId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Feedback_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "value" REAL NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Metric_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT
);

-- CreateTable
CREATE TABLE "TagMap" (
    "tagId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    PRIMARY KEY ("tagId", "entity", "entityId"),
    CONSTRAINT "TagMap_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
