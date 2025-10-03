/*
  Warnings:

  - You are about to drop the column `metrics` on the `Pair` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Pair" DROP COLUMN "metrics",
ADD COLUMN     "listOfTrades" JSONB,
ADD COLUMN     "performance" JSONB,
ADD COLUMN     "properties" JSONB,
ADD COLUMN     "riskPerformanceRatios" JSONB,
ADD COLUMN     "tradesAnalysis" JSONB;
