import { z } from 'zod';

// Enums (as Zod enums)
export const RoleEnum = z.enum(['USER', 'ADMIN', 'SUPPORT', 'MANAGER']);
export const SubscriptionPeriodEnum = z.enum([
  'ONE_MONTH',
  'THREE_MONTHS',
  'SIX_MONTHS',
  'TWELVE_MONTHS',
]);
export const SubscriptionStatusEnum = z.enum([
  'ACTIVE',
  'EXPIRED',
  'PENDING',
  'CANCELLED',
]);
export const InviteStatusEnum = z.enum(['PENDING', 'SENT', 'COMPLETED']);
export const PaymentNetworkEnum = z.enum(['USDT', 'BTC', 'ETH']);
export const PaymentStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'UNDERPAID',
  'EXPIRED',
  'FAILED',
]);
export const CommissionStatusEnum = z.enum(['PENDING', 'PAID', 'CANCELLED']);
export const NotificationTypeEnum = z.enum([
  'SUBSCRIPTION_CONFIRMED',
  'SUBSCRIPTION_EXPIRED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'ADMIN_ACTION_REQUIRED',
  'TRADINGVIEW_INVITE_SENT',
  'TRADINGVIEW_INVITE_COMPLETED',
  'RENEWAL_REMINDER',
  'GENERAL',
]);

// User schema
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  passwordHash: z.string().min(8),
  name: z.string().optional().nullable(),
  tradingviewUsername: z.string().optional().nullable(),
  role: RoleEnum.optional(),
  createdAt: z.date().optional(),
});

// Session schema
export const sessionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  sessionToken: z.string(),
  expires: z.date(),
  createdAt: z.date().optional(),
});

// Pair schema
export const pairSchema = z.object({
  id: z.string().uuid().optional(),
  symbol: z.string().min(3),
  version: z.string().optional(),
  performance: z.string().optional().nullable(),
  tradesAnalysis: z.string().optional().nullable(),
  riskPerformanceRatios: z.string().optional().nullable(),
  listOfTrades: z.string().optional().nullable(),
  properties: z.string().optional().nullable(),
  priceOneMonth: z.union([z.number(), z.string()]),
  priceThreeMonths: z.union([z.number(), z.string()]),
  priceSixMonths: z.union([z.number(), z.string()]),
  priceTwelveMonths: z.union([z.number(), z.string()]),
  discountOneMonth: z.union([z.number(), z.string()]).default(0),
  discountThreeMonths: z.union([z.number(), z.string()]).default(0),
  discountSixMonths: z.union([z.number(), z.string()]).default(0),
  discountTwelveMonths: z.union([z.number(), z.string()]).default(0),
  timeframe: z.string(),
  createdAt: z.date().optional(),
});

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  pairId: z.string().uuid(),
  period: SubscriptionPeriodEnum,
  startDate: z.date(),
  expiryDate: z.date(),
  status: SubscriptionStatusEnum,
  paymentId: z.string().uuid().optional().nullable(),
  inviteStatus: InviteStatusEnum,
});

// Payment schema
export const paymentSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  pairId: z.string().uuid(),
  amount: z.number(),
  network: PaymentNetworkEnum,
  status: PaymentStatusEnum,
  txHash: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  createdAt: z.date().optional(),
});

// Affiliate schema
export const affiliateSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  referralCode: z.string(),
  walletAddress: z.string().optional().nullable(),
  commissionRate: z.number(),
});

// Commission schema
export const commissionSchema = z.object({
  id: z.string().uuid().optional(),
  affiliateId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  amount: z.number(),
  status: CommissionStatusEnum,
  payoutId: z.string().optional().nullable(),
  createdAt: z.date().optional(),
});

// Event schema
export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  eventType: z.string(),
  timestamp: z.date().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// AuditLog schema
export const auditLogSchema = z.object({
  id: z.string().uuid().optional(),
  adminId: z.string().uuid(),
  action: z.string(),
  targetId: z.string().optional().nullable(),
  targetType: z.string().optional().nullable(),
  timestamp: z.date().optional(),
  details: z.record(z.string(), z.any()).optional(),
});

// Notification schema
export const notificationSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional().nullable(),
  adminId: z.string().uuid().optional().nullable(),
  type: NotificationTypeEnum,
  title: z.string(),
  message: z.string(),
  data: z.record(z.string(), z.any()).optional(),
  isRead: z.boolean().optional(),
  createdAt: z.date().optional(),
});
