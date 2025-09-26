'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { hasRolePrivilege, type UserRole } from '@/components/auth/RoleBadge';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | null;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole = 'user',
  redirectTo = '/signin',
  fallback,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push(
        `${redirectTo}?callbackUrl=${encodeURIComponent(
          window.location.pathname
        )}`
      );
      return;
    }

    // Skip role check if requiredRole is null (only authentication required)
    if (requiredRole !== null) {
      const userRole = session.user?.role as UserRole;

      if (
        requiredRole &&
        (!userRole || !hasRolePrivilege(userRole, requiredRole))
      ) {
        console.log('User role:', userRole, 'Required role:', requiredRole);
        router.push('/unauthorized');
        return;
      }
    }
  }, [session, status, router, requiredRole, redirectTo]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex space-x-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return fallback || null;
  }

  if (
    requiredRole &&
    !hasRolePrivilege(session.user.role as UserRole, requiredRole)
  ) {
    return fallback || null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
