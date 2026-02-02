-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('QUALIFICATION', 'PLAYOFF');

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "eventCode" CHAR(5) NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "matchNumber" SMALLINT NOT NULL,
    "teamNumber" SMALLINT NOT NULL,
    "notes" VARCHAR(400) NOT NULL,
    "minorFouls" SMALLINT NOT NULL,
    "majorFouls" SMALLINT NOT NULL,
    "autoNotes" VARCHAR(400) NOT NULL,
    "autoMovement" BOOLEAN NOT NULL,
    "teleopNotes" VARCHAR(400) NOT NULL,
    "endgameNotes" VARCHAR(400) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
