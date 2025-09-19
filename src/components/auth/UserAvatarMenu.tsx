'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  User,
  Settings,
  CreditCard,
  LogOut,
  Shield,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoleBadge, type UserRole } from './RoleBadge';

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
}

interface UserAvatarMenuProps {
  className?: string;
  showName?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function UserAvatarMenu({
  className,
  showName = false,
  size = 'default',
}: UserAvatarMenuProps) {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user as ExtendedUser;

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  const getAvatarSize = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatName = (name: string) => {
    if (name.length <= 20) return name;
    return name.slice(0, 17) + '...';
  };

  const formatEmail = (email: string) => {
    if (email.length <= 30) return email;
    return email.slice(0, 27) + '...';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`relative h-auto p-1 ${
            showName ? 'justify-start space-x-2 px-2' : ''
          } ${className}`}
        >
          <Avatar className={getAvatarSize()}>
            <AvatarImage src={user.image || ''} alt={user.name || ''} />
            <AvatarFallback className="text-sm">
              {getInitials(user.name || user.email || 'U')}
            </AvatarFallback>
          </Avatar>
          {showName && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">
                {formatName(user.name || '')}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatEmail(user.email || '')}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {user.role && (
              <div className="pt-1">
                <RoleBadge role={user.role} size="sm" />
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href="/dashboard" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </a>
          </DropdownMenuItem>

          {user.role === 'admin' && (
            <DropdownMenuItem asChild>
              <a href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Console</span>
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserAvatarMenu;
