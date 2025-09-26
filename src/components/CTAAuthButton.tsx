'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTAAuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="h-12 w-48 bg-zinc-700 animate-pulse rounded-lg"></div>
    );
  }

  if (session?.user) {
    return (
      <Button
        asChild
        size="lg"
        className="font-bold bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white shadow-lg px-8 py-3"
      >
        <Link href="/dashboard">
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="lg"
      className="font-bold bg-gradient-to-r from-pink-600 to-purple-400 hover:from-pink-700 hover:to-purple-500 text-white shadow-lg px-8 py-3"
    >
      <Link href="/signup">
        Get Started
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}
