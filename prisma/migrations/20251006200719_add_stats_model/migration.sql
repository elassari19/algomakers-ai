-- CreateEnum
CREATE TYPE "public"."StatsType" AS ENUM ('REVENUE_TOTAL', 'REVENUE_MONTHLY', 'REVENUE_DAILY', 'AVERAGE_ORDER_VALUE', 'USER_COUNT_TOTAL', 'USER_COUNT_ACTIVE', 'USER_COUNT_NEW', 'USER_RETENTION_RATE', 'USER_CHURN_RATE', 'SUBSCRIPTION_COUNT_TOTAL', 'SUBSCRIPTION_COUNT_ACTIVE', 'SUBSCRIPTION_COUNT_NEW', 'SUBSCRIPTION_COUNT_EXPIRED', 'SUBSCRIPTION_COUNT_CANCELLED', 'SUBSCRIPTION_CONVERSION_RATE', 'SUBSCRIPTION_RENEWAL_RATE', 'PAYMENT_COUNT_TOTAL', 'PAYMENT_COUNT_SUCCESSFUL', 'PAYMENT_COUNT_FAILED', 'PAYMENT_COUNT_PENDING', 'PAYMENT_SUCCESS_RATE', 'PAIR_COUNT_TOTAL', 'PAIR_PERFORMANCE_AVG', 'PAIR_POPULARITY', 'AUDIT_LOG_COUNT', 'NOTIFICATION_COUNT', 'EVENT_COUNT', 'COMMISSION_TOTAL', 'AFFILIATE_COUNT', 'REFERRAL_COUNT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."StatsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL_TIME');

-- CreateTable
CREATE TABLE "public"."Stats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "public"."StatsType" NOT NULL,
    "category" TEXT NOT NULL,
    "totalValue" DECIMAL(65,30),
    "currentValue" DECIMAL(65,30),
    "previousValue" DECIMAL(65,30),
    "changeValue" DECIMAL(65,30),
    "changePercent" DECIMAL(65,30),
    "period" "public"."StatsPeriod" NOT NULL DEFAULT 'DAILY',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Stats_date_type_idx" ON "public"."Stats"("date", "type");

-- CreateIndex
CREATE INDEX "Stats_category_period_idx" ON "public"."Stats"("category", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Stats_date_type_category_period_key" ON "public"."Stats"("date", "type", "category", "period");
