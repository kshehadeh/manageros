-- CreateTable
CREATE TABLE "UserGithubCredentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "encryptedPat" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGithubCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonGithubAccount" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "githubDisplayName" TEXT,
    "githubEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonGithubAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGithubCredentials_userId_key" ON "UserGithubCredentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonGithubAccount_personId_key" ON "PersonGithubAccount"("personId");

-- CreateIndex
CREATE INDEX "PersonGithubAccount_githubUsername_idx" ON "PersonGithubAccount"("githubUsername");

-- AddForeignKey
ALTER TABLE "UserGithubCredentials" ADD CONSTRAINT "UserGithubCredentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonGithubAccount" ADD CONSTRAINT "PersonGithubAccount_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
