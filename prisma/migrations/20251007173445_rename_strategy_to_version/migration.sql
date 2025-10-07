/*
  Warnings:

  - You are about to drop the column `strategy` on the `Pair` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Pair" DROP COLUMN "strategy",
ADD COLUMN     "version" TEXT;
