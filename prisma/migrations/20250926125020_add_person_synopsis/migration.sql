-- CreateTable
CREATE TABLE "PersonSynopsis" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "includeFeedback" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "sources" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonSynopsis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonSynopsis_personId_idx" ON "PersonSynopsis"("personId");

-- CreateIndex
CREATE INDEX "PersonSynopsis_fromDate_idx" ON "PersonSynopsis"("fromDate");

-- CreateIndex
CREATE INDEX "PersonSynopsis_toDate_idx" ON "PersonSynopsis"("toDate");

-- AddForeignKey
ALTER TABLE "PersonSynopsis" ADD CONSTRAINT "PersonSynopsis_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
