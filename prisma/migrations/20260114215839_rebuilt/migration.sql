/*
  Warnings:

  - Added the required column `autoHubMisses` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoHubScore` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoLevel1` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endgameHubMisses` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endgameHubScore` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teleopHubMisses` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teleopHubScore` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trenchOrBump` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrenchOrBump" AS ENUM ('TRENCH', 'BUMP');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('ONE', 'TWO', 'THREE', 'FAILED');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "autoHubMisses" SMALLINT NOT NULL,
ADD COLUMN     "autoHubScore" SMALLINT NOT NULL,
ADD COLUMN     "autoLevel1" BOOLEAN NOT NULL,
ADD COLUMN     "endgameHubMisses" SMALLINT NOT NULL,
ADD COLUMN     "endgameHubScore" SMALLINT NOT NULL,
ADD COLUMN     "endgameLevel" "Level",
ADD COLUMN     "teleopHubMisses" SMALLINT NOT NULL,
ADD COLUMN     "teleopHubScore" SMALLINT NOT NULL,
ADD COLUMN     "teleopLevel" "Level",
ADD COLUMN     "trenchOrBump" "TrenchOrBump" NOT NULL;
