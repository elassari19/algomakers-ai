/*
  Warnings:

  - You are about to drop the column `discountRate` on the `Pair` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Pair` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Pair` table. All the data in the column will be lost.
  - Added the required column `priceOneMonth` to the `Pair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSixMonths` to the `Pair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceThreeMonths` to the `Pair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceTwelveMonths` to the `Pair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeframe` to the `Pair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Pair` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Pair" DROP COLUMN "discountRate",
DROP COLUMN "name",
DROP COLUMN "price",
ADD COLUMN     "discountOneMonth" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "discountSixMonths" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "discountThreeMonths" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "discountTwelveMonths" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "priceOneMonth" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "priceSixMonths" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "priceThreeMonths" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "priceTwelveMonths" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "timeframe" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
