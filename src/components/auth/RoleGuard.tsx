'use client';

import { useSession } from 'next-auth/react';
import { hasRolePrivilege, type UserRole } from '@/components/auth/RoleBadge';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const { data: session } = useSession();

  if (!session?.user?.role) {
    return <>{fallback}</>;
  }

  const userRole = session.user.role as UserRole;

  const hasAccess = requireAll
    ? allowedRoles.every((role) => hasRolePrivilege(userRole, role))
    : allowedRoles.some((role) => hasRolePrivilege(userRole, role));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common role checks
export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ModeratorAndAbove({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['moderator']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function PremiumAndAbove({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['premium']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export default RoleGuard;
