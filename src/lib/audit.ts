/**
 * Utility functions for audit logging
 */

// Audit log actions enum for consistency
export enum AuditAction {
  // User management
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // Pair management
  CREATE_PAIR = 'CREATE_PAIR',
  UPDATE_PAIR = 'UPDATE_PAIR',
  DELETE_PAIR = 'DELETE_PAIR',
  
  // Subscription management
  CREATE_SUBSCRIPTION = 'CREATE_SUBSCRIPTION',
  UPDATE_SUBSCRIPTION = 'UPDATE_SUBSCRIPTION',
  CANCEL_SUBSCRIPTION = 'CANCEL_SUBSCRIPTION',
  
  // Payment management
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  REFUND_PAYMENT = 'REFUND_PAYMENT',
  CREATE_PAYMENT = 'CREATE_PAYMENT',
  UPDATE_PAYMENT = 'UPDATE_PAYMENT',
  DELETE_PAYMENT = 'DELETE_PAYMENT',
  
  // System administration
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_RESTORE = 'SYSTEM_RESTORE',
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  
  // Data management
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  
  // Security
  ROLE_CHANGE = 'ROLE_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

// Target types for audit logs
export enum AuditTargetType {
  USER = 'USER',
  PAIR = 'PAIR',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
  CONFIG = 'CONFIG',
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
  adminId,
  action,
  targetId,
  targetType,
  details,
}: {
  adminId: string;
  action: AuditAction | string;
  targetId?: string;
  targetType?: AuditTargetType | string;
  details?: AuditDetails;
}): Promise<void> {
  try {
    // Import prisma dynamically to avoid circular dependencies
    const { prisma } = await import('@/lib/prisma');
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: action.toString(),
        targetId,
        targetType: targetType?.toString(),
        details: details || {},
      },
    });
  } catch (error) {
    // Silently fail audit logging to not break main functionality
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Create an audit log entry via API (for client-side use)
 */
export async function createAuditLogViaAPI({
  adminId,
  action,
  targetId,
  targetType,
  details,
}: {
  adminId: string;
  action: AuditAction | string;
  targetId?: string;
  targetType?: AuditTargetType | string;
  details?: AuditDetails;
}): Promise<void> {
  try {
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminId,
        action,
        targetId,
        targetType,
        details,
      }),
    });
  } catch (error) {
    // Silently fail audit logging to not break main functionality
    console.error('Failed to create audit log via API:', error);
  }
}

/**
 * Helper function to create user-related audit logs
 */
export const auditUserAction = async (
  adminId: string,
  action: AuditAction.CREATE_USER | AuditAction.UPDATE_USER | AuditAction.DELETE_USER,
  targetUserId: string,
  details?: AuditDetails
) => {
  await createAuditLog({
    adminId,
    action,
    targetId: targetUserId,
    targetType: AuditTargetType.USER,
    details,
  });
};

/**
 * Helper function to create authentication audit logs
 */
export const auditAuthAction = async (
  userId: string,
  action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.FAILED_LOGIN,
  details?: AuditDetails
) => {
  await createAuditLog({
    adminId: userId,
    action,
    details: {
      ...details,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    },
  });
};

/**
 * Helper function to create system audit logs
 */
export const auditSystemAction = async (
  adminId: string,
  action: AuditAction,
  details?: AuditDetails
) => {
  await createAuditLog({
    adminId,
    action,
    targetType: AuditTargetType.SYSTEM,
    details,
  });
};