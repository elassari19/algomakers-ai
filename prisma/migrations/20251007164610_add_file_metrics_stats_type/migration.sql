/*
  Warnings:

  - You are about to drop the column `category` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `changePercent` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `changeValue` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `currentValue` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `fileMetrics` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `periodEnd` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `periodStart` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `previousValue` on the `Stats` table. All the data in the column will be lost.
  - You are about to drop the column `totalValue` on the `Stats` table. All the data in the column will be lost.
  - Made the column `metadata` on table `Stats` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "public"."StatsType" ADD VALUE 'FILE_METRICS';

-- DropIndex
DROP INDEX "public"."Stats_category_period_idx";

-- DropIndex
DROP INDEX "public"."Stats_date_type_category_period_key";

-- DropIndex
DROP INDEX "public"."Stats_date_type_idx";

-- AlterTable
ALTER TABLE "public"."Stats" DROP COLUMN "category",
DROP COLUMN "changePercent",
DROP COLUMN "changeValue",
DROP COLUMN "currentValue",
DROP COLUMN "date",
DROP COLUMN "fileMetrics",
DROP COLUMN "periodEnd",
DROP COLUMN "periodStart",
DROP COLUMN "previousValue",
DROP COLUMN "totalValue",
ALTER COLUMN "period" DROP NOT NULL,
ALTER COLUMN "period" DROP DEFAULT,
ALTER COLUMN "metadata" SET NOT NULL;
