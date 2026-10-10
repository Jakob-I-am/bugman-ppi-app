/*
  Warnings:

  - You are about to drop the column `pest` on the `Enquiry` table. All the data in the column will be lost.
  - You are about to drop the column `postcode` on the `Enquiry` table. All the data in the column will be lost.
  - You are about to drop the column `siteAddress` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `visitDate` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `fieldKey` on the `Photo` table. All the data in the column will be lost.
  - Added the required column `neededBy` to the `Enquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyAddress` to the `Enquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service` to the `Enquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyAddress` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BUILDING_AND_PEST', 'BUILDING', 'TIMBER_PEST');

-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('MAJOR_DEFECT', 'SAFETY_HAZARD', 'MINOR_DEFECT', 'TIMBER_PEST', 'CONDUCIVE_CONDITION', 'FURTHER_INSPECTION', 'OBSERVATION');

-- DropIndex
DROP INDEX "Photo_jobId_fieldKey_idx";

-- AlterTable
ALTER TABLE "Enquiry" DROP COLUMN "pest",
DROP COLUMN "postcode",
ADD COLUMN     "neededBy" TEXT NOT NULL,
ADD COLUMN     "propertyAddress" TEXT NOT NULL,
ADD COLUMN     "service" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "siteAddress",
DROP COLUMN "visitDate",
ADD COLUMN     "propertyAddress" TEXT NOT NULL,
ADD COLUMN     "reportType" "ReportType" NOT NULL DEFAULT 'BUILDING_AND_PEST';

-- AlterTable
ALTER TABLE "Photo" DROP COLUMN "fieldKey",
ADD COLUMN     "findingId" TEXT,
ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "ReportSection" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "element" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "recommendation" TEXT NOT NULL DEFAULT '',
    "detail" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportSection_jobId_position_idx" ON "ReportSection"("jobId", "position");

-- CreateIndex
CREATE INDEX "Finding_sectionId_position_idx" ON "Finding"("sectionId", "position");

-- CreateIndex
CREATE INDEX "Photo_jobId_idx" ON "Photo"("jobId");

-- CreateIndex
CREATE INDEX "Photo_sectionId_idx" ON "Photo"("sectionId");

-- CreateIndex
CREATE INDEX "Photo_findingId_idx" ON "Photo"("findingId");

-- AddForeignKey
ALTER TABLE "ReportSection" ADD CONSTRAINT "ReportSection_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ReportSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ReportSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
