/*
  Warnings:

  - You are about to drop the column `autoDisruptNz` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `overBump` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `teleopClimbFailed` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `teleopLevel` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `underTrench` on the `Report` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matchNumber,teamNumber]` on the table `Report` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatarId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `alliance` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crossBump` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crossTrench` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inMatch` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shootingConfidence` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teleopWasDefended` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Alliance" AS ENUM ('RED', 'BLUE');

-- CreateEnum
CREATE TYPE "Drivetrain" AS ENUM ('SWERVE', 'TANK', 'MECANUM');

-- CreateEnum
CREATE TYPE "Shooter" AS ENUM ('SINGLE', 'DUAL', 'TRIPLE', 'TURRET');

-- CreateEnum
CREATE TYPE "AutoAction" AS ENUM ('COLLECT_DEPOT', 'COLLECT_NEUTRAL', 'COLLECT_OUTPOST', 'CROSS_BUMP', 'CROSS_TRENCH', 'SHOOT', 'CLIMB');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StartingPosition" ADD VALUE 'LEFT_BUMP';
ALTER TYPE "StartingPosition" ADD VALUE 'LEFT_TRENCH';
ALTER TYPE "StartingPosition" ADD VALUE 'RIGHT_BUMP';
ALTER TYPE "StartingPosition" ADD VALUE 'RIGHT_TRENCH';

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "autoDisruptNz",
DROP COLUMN "overBump",
DROP COLUMN "teleopClimbFailed",
DROP COLUMN "teleopLevel",
DROP COLUMN "underTrench",
ADD COLUMN     "alliance" "Alliance" NOT NULL,
ADD COLUMN     "crossBump" BOOLEAN NOT NULL,
ADD COLUMN     "crossTrench" BOOLEAN NOT NULL,
ADD COLUMN     "inMatch" BOOLEAN NOT NULL,
ADD COLUMN     "shootingConfidence" SMALLINT NOT NULL,
ADD COLUMN     "teleopWasDefended" BOOLEAN NOT NULL,
ALTER COLUMN "endgameLevel" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarId" UUID;

-- CreateTable
CREATE TABLE "PitReport" (
    "id" SERIAL NOT NULL,
    "eventCode" CHAR(5) NOT NULL,
    "teamNumber" SMALLINT NOT NULL,
    "drivetrain" "Drivetrain" NOT NULL,
    "shooter" "Shooter" NOT NULL,
    "drumShooter" BOOLEAN NOT NULL,
    "estimatedBps" DECIMAL(65,30) NOT NULL,
    "driverEvents" SMALLINT NOT NULL,
    "weightLbs" DECIMAL(65,30) NOT NULL,
    "widthIn" DECIMAL(65,30) NOT NULL,
    "lengthIn" DECIMAL(65,30) NOT NULL,
    "canFerry" BOOLEAN NOT NULL,
    "climbLevel" SMALLINT NOT NULL,
    "notes" VARCHAR(400) NOT NULL,
    "photoId" UUID NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "PitReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoRoutine" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "startingPosition" "StartingPosition" NOT NULL,
    "actions" "AutoAction"[],

    CONSTRAINT "AutoRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PitReport_photoId_key" ON "PitReport"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_matchNumber_teamNumber_key" ON "Report"("matchNumber", "teamNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_avatarId_key" ON "User"("avatarId");

-- AddForeignKey
ALTER TABLE "AutoRoutine" ADD CONSTRAINT "AutoRoutine_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PitReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
