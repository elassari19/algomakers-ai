-- AlterTable
ALTER TABLE "public"."Commission" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'REFERRAL';
