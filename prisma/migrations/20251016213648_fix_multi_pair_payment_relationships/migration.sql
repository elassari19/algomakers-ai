/*
  Warnings:

  - You are about to drop the column `adminId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'TRIAL';
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'PAID';
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'RENEWING';
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'FAILED';

-- AlterEnum
ALTER TYPE "public"."UserStatus" ADD VALUE 'UNVERIFIED';

-- DropForeignKey
ALTER TABLE "public"."AuditLog" DROP CONSTRAINT "AuditLog_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Event" DROP CONSTRAINT "Event_userId_fkey";

-- DropIndex
DROP INDEX "public"."Subscription_paymentId_key";

-- AlterTable
ALTER TABLE "public"."AuditLog" DROP COLUMN "adminId",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "actorRole" "public"."Role",
ADD COLUMN     "responseStatus" TEXT;

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "status" SET DEFAULT 'UNVERIFIED';

-- DropTable
DROP TABLE "public"."Event";

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
