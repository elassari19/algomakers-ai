'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function AuthNavButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-16 bg-zinc-700 animate-pulse rounded"></div>
        <div className="h-8 w-20 bg-zinc-700 animate-pulse rounded"></div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="font-bold bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white shadow-lg px-8 py-3"
        >
          <Link href="/dashboard">
            <User className="w-4 h-4 mr-1" />
            Dashboard
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:text-pink-400 hover:border-pink-400 cursor-pointer"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="text-zinc-300 hover:text-pink-400"
      >
        <Link href="/signin">Sign In</Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white"
      >
        <Link href="/signup">Get Started</Link>
      </Button>
    </div>
  );
}
