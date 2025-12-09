-- CreateTable
CREATE TABLE "NoteImage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteImage_organizationId_idx" ON "NoteImage"("organizationId");

-- CreateIndex
CREATE INDEX "NoteImage_uploadedById_idx" ON "NoteImage"("uploadedById");

-- CreateIndex
CREATE INDEX "NoteImage_createdAt_idx" ON "NoteImage"("createdAt");

-- AddForeignKey
ALTER TABLE "NoteImage" ADD CONSTRAINT "NoteImage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteImage" ADD CONSTRAINT "NoteImage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
