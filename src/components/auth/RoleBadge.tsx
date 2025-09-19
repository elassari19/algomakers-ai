'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Shield, User, Crown, Star, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const roleBadgeVariants = cva('inline-flex items-center gap-1.5 font-medium', {
  variants: {
    role: {
      admin:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      moderator:
        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      premium:
        'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      pro: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      user: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
      vip: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 dark:border-purple-800',
    },
    size: {
      sm: 'text-xs px-2 py-0.5',
      default: 'text-sm px-2.5 py-1',
      lg: 'text-base px-3 py-1.5',
    },
  },
  defaultVariants: {
    role: 'user',
    size: 'default',
  },
});

type UserRole = 'admin' | 'moderator' | 'premium' | 'pro' | 'user' | 'vip';

const roleConfig: Record<
  UserRole,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  admin: {
    label: 'Admin',
    icon: Shield,
    description: 'Full system access and management privileges',
  },
  moderator: {
    label: 'Moderator',
    icon: Star,
    description: 'Community management and moderation privileges',
  },
  premium: {
    label: 'Premium',
    icon: Crown,
    description: 'Premium subscription with advanced features',
  },
  pro: {
    label: 'Pro',
    icon: Zap,
    description: 'Professional plan with enhanced capabilities',
  },
  user: {
    label: 'User',
    icon: User,
    description: 'Standard user account',
  },
  vip: {
    label: 'VIP',
    icon: Crown,
    description: 'VIP member with exclusive access and benefits',
  },
};

interface RoleBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'>,
    VariantProps<typeof roleBadgeVariants> {
  role: UserRole;
  showIcon?: boolean;
  showTooltip?: boolean;
}

export function RoleBadge({
  role,
  size,
  showIcon = true,
  showTooltip = false,
  className,
  ...props
}: RoleBadgeProps) {
  const config = roleConfig[role];
  const IconComponent = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(roleBadgeVariants({ role, size }), className)}
      title={showTooltip ? config.description : undefined}
      {...props}
    >
      {showIcon && <IconComponent className="h-3 w-3" />}
      <span>{config.label}</span>
    </Badge>
  );
}

// Helper function to get role hierarchy for comparison
export function getRoleHierarchy(role: UserRole): number {
  const hierarchy: Record<UserRole, number> = {
    admin: 100,
    moderator: 80,
    vip: 60,
    premium: 50,
    pro: 40,
    user: 10,
  };
  return hierarchy[role] || 0;
}

// Helper function to check if a role has certain privileges
export function hasRolePrivilege(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return getRoleHierarchy(userRole) >= getRoleHierarchy(requiredRole);
}

// Helper function to get role color for use in other components
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: 'red',
    moderator: 'purple',
    premium: 'yellow',
    pro: 'blue',
    user: 'gray',
    vip: 'purple',
  };
  return colors[role] || 'gray';
}

export type { UserRole };
export default RoleBadge;
