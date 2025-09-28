/*
  Warnings:

  - You are about to drop the column `amount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `pairId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `price` to the `Pair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentNetwork" ADD VALUE 'USDT_TRC20';
ALTER TYPE "public"."PaymentNetwork" ADD VALUE 'USDT_ERC20';
ALTER TYPE "public"."PaymentNetwork" ADD VALUE 'USDT_BEP20';

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_pairId_fkey";

-- AlterTable
ALTER TABLE "public"."Pair" ADD COLUMN     "discountRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "amount",
DROP COLUMN "pairId",
ADD COLUMN     "actuallyPaid" DECIMAL(65,30),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "orderData" JSONB,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "totalAmount" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "basePrice" DECIMAL(65,30),
ADD COLUMN     "discountRate" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "public"."PaymentItem" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "basePrice" DECIMAL(65,30) NOT NULL,
    "discountRate" DECIMAL(65,30) NOT NULL,
    "finalPrice" DECIMAL(65,30) NOT NULL,
    "period" "public"."SubscriptionPeriod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentItem_paymentId_pairId_key" ON "public"."PaymentItem"("paymentId", "pairId");

-- AddForeignKey
ALTER TABLE "public"."PaymentItem" ADD CONSTRAINT "PaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentItem" ADD CONSTRAINT "PaymentItem_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "public"."Pair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
