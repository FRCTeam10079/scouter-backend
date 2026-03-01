/*
  Warnings:

  - You are about to drop the column `autoHubScore` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `autoLevel1` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `autoMovement` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `endgameHubMisses` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `endgameHubScore` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `teleopHubScore` on the `Report` table. All the data in the column will be lost.
  - The `endgameLevel` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `autoClimb` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoCollectDepot` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoCollectNeutral` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoCollectOutpost` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoDisruptNz` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoHubScores` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autoPasses` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endgameClimbFailed` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overBump` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secondsIncapacitated` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startingPosition` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teleopClimbFailed` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teleopHubScores` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `underTrench` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teleopLevel` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StartingPosition" AS ENUM ('LEFT', 'CENTER', 'RIGHT');

-- CreateEnum
CREATE TYPE "AutoClimb" AS ENUM ('NONE', 'LEVEL1', 'FAILED');

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "autoHubScore",
DROP COLUMN "autoLevel1",
DROP COLUMN "autoMovement",
DROP COLUMN "endgameHubMisses",
DROP COLUMN "endgameHubScore",
DROP COLUMN "teleopHubScore",
ADD COLUMN     "autoClimb" "AutoClimb" NOT NULL,
ADD COLUMN     "autoCollectDepot" BOOLEAN NOT NULL,
ADD COLUMN     "autoCollectNeutral" BOOLEAN NOT NULL,
ADD COLUMN     "autoCollectOutpost" BOOLEAN NOT NULL,
ADD COLUMN     "autoDisruptNz" BOOLEAN NOT NULL,
ADD COLUMN     "autoHubScores" SMALLINT NOT NULL,
ADD COLUMN     "autoPasses" SMALLINT NOT NULL,
ADD COLUMN     "endgameClimbFailed" BOOLEAN NOT NULL,
ADD COLUMN     "overBump" BOOLEAN NOT NULL,
ADD COLUMN     "secondsIncapacitated" SMALLINT NOT NULL,
ADD COLUMN     "startingPosition" "StartingPosition" NOT NULL,
ADD COLUMN     "teleopClimbFailed" BOOLEAN NOT NULL,
ADD COLUMN     "teleopHubScores" SMALLINT NOT NULL,
ADD COLUMN     "underTrench" BOOLEAN NOT NULL,
DROP COLUMN "endgameLevel",
ADD COLUMN     "endgameLevel" SMALLINT NOT NULL DEFAULT 0,
DROP COLUMN "teleopLevel",
ADD COLUMN     "teleopLevel" SMALLINT NOT NULL;

-- DropEnum
DROP TYPE "Level";
