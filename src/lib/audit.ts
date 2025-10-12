import { Role } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
/**
 * Utility functions for audit logging
 */

// Audit log actions enum for consistency
export enum AuditAction {
  // Affiliate management
  CREATE_AFFILIATE = 'CREATE_AFFILIATE',
  UPDATE_AFFILIATE = 'UPDATE_AFFILIATE',
  DELETE_AFFILIATE = 'DELETE_AFFILIATE',
  GET_AFFILIATE = 'GET_AFFILIATE',
  APPROVE_AFFILIATE = 'APPROVE_AFFILIATE',
  REJECT_AFFILIATE = 'REJECT_AFFILIATE',

  // Backtest management
  CREATE_BACKTEST = 'CREATE_BACKTEST',
  UPDATE_BACKTEST = 'UPDATE_BACKTEST',
  DELETE_BACKTEST = 'DELETE_BACKTEST',
  GET_BACKTEST = 'GET_BACKTEST',

  // Payouts
  INITIATE_PAYOUT = 'INITIATE_PAYOUT',
  COMPLETE_PAYOUT = 'COMPLETE_PAYOUT',
  CREATE_PAYOUT = 'CREATE_PAYOUT',
  UPDATE_PAYOUT = 'UPDATE_PAYOUT',
  FAIL_PAYOUT = 'FAIL_PAYOUT',

  // User management
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  GET_USER = 'GET_USER',
  
  // Account management
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Pair management
  CREATE_PAIR = 'CREATE_PAIR',
  UPDATE_PAIR = 'UPDATE_PAIR',
  DELETE_PAIR = 'DELETE_PAIR',
  GET_PAIR = 'GET_PAIR',
  
  // Subscription management
  CREATE_SUBSCRIPTION = 'CREATE_SUBSCRIPTION',
  UPDATE_SUBSCRIPTION = 'UPDATE_SUBSCRIPTION',
  CANCEL_SUBSCRIPTION = 'CANCEL_SUBSCRIPTION',
  DELETE_SUBSCRIPTION = 'DELETE_SUBSCRIPTION',
  RENEW_SUBSCRIPTION = 'RENEW_SUBSCRIPTION',
  PAUSE_SUBSCRIPTION = 'PAUSE_SUBSCRIPTION',
  RESUME_SUBSCRIPTION = 'RESUME_SUBSCRIPTION',
  GET_SUBSCRIPTION = 'GET_SUBSCRIPTION',
  
  // Payment management
  CREATE_PAYMENT = 'CREATE_PAYMENT',
  UPDATE_PAYMENT = 'UPDATE_PAYMENT',
  DELETE_PAYMENT = 'DELETE_PAYMENT',
  GET_PAYMENT = 'GET_PAYMENT',
  
  // TradingView integration
  TRADINGVIEW_INVITED = 'TRADINGVIEW_INVITED',
  TRADINGVIEW_JOINED = 'TRADINGVIEW_JOINED',
  TRADINGVIEW_USERNAME_VERIFIED = 'TRADINGVIEW_USERNAME_VERIFIED',
  
  // Notifications
  CREATE_NOTIFICATION = 'CREATE_NOTIFICATION',
  UPDATE_NOTIFICATION = 'UPDATE_NOTIFICATION',
  DELETE_NOTIFICATION = 'DELETE_NOTIFICATION',
  GET_NOTIFICATION = 'GET_NOTIFICATION',
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  NOTIFICATION_READ = 'NOTIFICATION_READ',

  // Email
  SEND_EMAIL = 'SEND_EMAIL',
  EMAIL_BOUNCED = 'EMAIL_BOUNCED',
  EMAIL_COMPLAINT = 'EMAIL_COMPLAINT',
  
  // System administration
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_RESTORE = 'SYSTEM_RESTORE',
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  FEATURE_ACCESSED = 'FEATURE_ACCESSED',
  
  // Data management
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  
  // Security
  ROLE_CHANGE = 'ROLE_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  
  // Internal 
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Target types for audit logs
export enum AuditTargetType {
  AFFILIATE = 'AFFILIATE',
  USER = 'USER',
  BACKTEST = 'BACKTEST',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
  CONFIG = 'CONFIG',
  NOTIFICATION = 'NOTIFICATION',
  EVENT = 'EVENT',
  PAYOUT = 'PAYOUT',
}

// Interface for audit log details
export interface AuditDetails {
  [key: string]: any;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 * @param adminId - ID of the admin performing the action
 * @param action - The action being performed
 * @param targetId - Optional ID of the target resource
 * @param targetType - Optional type of the target resource
 * @param details - Optional additional details about the action
 */
export async function createAuditLog({
  actorId,
  actorRole,
  action,
  targetId,
  targetType,
  responseStatus,
  details,
}: {
  actorId?: string; // Make optional
  actorRole: Role;
  action: AuditAction | string;
  targetId?: string;
  targetType?: AuditTargetType | string;
  responseStatus?: string;
  details?: AuditDetails;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId || null, // Use null if not provided
        actorRole: actorRole || Role.USER,
        action: action.toString(),
        targetId: targetId,
        targetType: targetType?.toString(),
        responseStatus: responseStatus,
        details: details,
      },
    });
  } catch (error) {
    // Silently fail audit logging to not break main functionality
    console.error('Failed to create audit log:', error);
  }
}
